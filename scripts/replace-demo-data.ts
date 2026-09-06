import type { Sql, TransactionSql } from "postgres";

export async function replaceDemoData(
  sql: Sql,
  populate: (transaction: TransactionSql) => Promise<void>,
) {
  await sql.begin(async (transaction) => {
    await transaction`truncate bookings, daily_metrics, monthly_expectations,
      weekly_forecast, visibility_checks, actions, referral_categories restart identity`;
    await populate(transaction);
  });
}
