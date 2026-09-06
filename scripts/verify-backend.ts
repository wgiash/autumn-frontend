import assert from "node:assert/strict";
import { getSql } from "../src/lib/db";
import { getAvailableMonths, getMonthData } from "../src/lib/queries";
import { forecastValues, METRIC_FIELD, type Metric } from "../src/lib/chart-series";
import { generateChartMarkup } from "../src/lib/chart-gen";
import { replaceDemoData } from "./replace-demo-data";

const tables = ["bookings", "daily_metrics", "monthly_expectations", "weekly_forecast", "visibility_checks", "actions", "referral_categories"];

async function main() {
  const sql = getSql();
  try {
    const grants = await sql<{ table_name: string; rls: boolean; client_access: boolean }[]>`
      select c.relname as table_name, c.relrowsecurity as rls,
        (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') or
         has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')) as client_access
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ${sql(tables)}`;
    assert.equal(grants.length, tables.length);
    assert.ok(grants.every(row => row.rls && !row.client_access));
    console.log("PASS  All seven tables reject direct anonymous/authenticated client access");

    for (const { value: month } of await getAvailableMonths()) {
      const data = await getMonthData(month);
      const stages = Object.fromEntries(data.trend.stages.map(stage => [stage.key, stage.value]));
      const [daily] = await sql<{ ad: number; vis: number; bookings: number; revenue: number }[]>`
        select sum(ad_views)::int as ad, sum(visits)::int as vis,
          sum(direct_bookings)::int as bookings, sum(direct_revenue_cents)::int as revenue
        from public.daily_metrics where to_char(date, 'YYYY-MM') = ${month}`;
      const direct = data.bookings.filter(booking => booking.channel === "Your website");
      const cents = direct.reduce((sum, booking) => sum + Math.round(booking.value * 100), 0);
      assert.equal(stages.booked, direct.length, `${month}: booking count`);
      assert.equal(Math.round(stages.revenue * 100), cents, `${month}: booking revenue`);
      assert.equal(daily.bookings, direct.length, `${month}: underlying daily count`);
      assert.equal(daily.revenue, cents, `${month}: underlying daily revenue`);
      assert.equal(stages.seen, daily.ad, `${month}: calendar ad views`);
      assert.equal(stages.visited, daily.vis, `${month}: calendar visits`);
      assert.equal(data.outcomes.directCount, direct.length);
      assert.equal(Math.round(data.outcomes.directValue * 100), cents);

      const completeness = await sql<{ start: string; days: number }[]>`
        select date_trunc('week', date)::date::text as start, count(*)::int as days
        from public.daily_metrics group by 1`;
      const complete = new Set(completeness.filter(row => row.days === 7).map(row => row.start));
      for (const week of data.trend.weeks) {
        const priorDate = new Date(Date.parse(week.start) - 364 * 86400000).toISOString().slice(0, 10);
        for (const field of ["priorBookings", "priorRev", "priorAdViews", "priorVisits"] as const) {
          assert.equal(week[field] === null, !complete.has(priorDate), `${month} ${week.start}: ${field}`);
        }
      }
      for (const metric of Object.keys(METRIC_FIELD) as Metric[]) {
        const scale = metric === "revenue" ? 100 : 1;
        const values = forecastValues(data.trend, metric);
        assert.equal(values.reduce((sum, value) => sum + Math.round(value * scale), 0),
          Math.round(data.trend.legend.nextExpected[METRIC_FIELD[metric]] * scale), `${month}: ${metric} forecast`);
      }
      assert.doesNotMatch(generateChartMarkup(data.trend), /NaN|Infinity|undefined/);
      console.log(`PASS  ${month}: calendar totals, missing comparisons, forecast totals, valid chart`);
    }

    // Temporary mirrors keep the rollback test entirely separate from real records.
    // With max:1, all statements use this session until the connection closes.
    for (const table of tables) {
      await sql`create temporary table ${sql(table)} (id text primary key)`;
      await sql`insert into ${sql(table)} values ('original')`;
    }
    const [resolved] = await sql<{ safe: boolean }[]>`
      select bool_and(to_regclass(name) = to_regclass('pg_temp.' || name)) as safe
      from unnest(${tables}::text[]) as name`;
    assert.equal(resolved.safe, true, "Reset test must resolve only temporary tables");
    const simulatedFailure = new Error("simulated insert failure");
    await assert.rejects(replaceDemoData(sql, async transaction => {
      await transaction`insert into bookings values ('replacement')`;
      throw simulatedFailure;
    }), error => error === simulatedFailure);
    for (const table of tables) {
      const rows = await sql<{ id: string }[]>`select id from ${sql(table)}`;
      assert.deepEqual(rows.map(row => row.id), ["original"]);
    }
    console.log("PASS  Failed seed replacement rolls back truncation and every insert (temporary tables only)");
  } finally {
    await sql.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
