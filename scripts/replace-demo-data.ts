import type { Sql, TransactionSql } from "postgres";

export async function replaceDemoData(
  sql: Sql | TransactionSql,
  populate: (transaction: TransactionSql) => Promise<void>,
) {
  const replace = async (transaction: TransactionSql) => {
    await transaction`truncate bookings, daily_metrics, monthly_expectations,
      weekly_forecast, visibility_checks, actions, referral_categories restart identity`;
    await populate(transaction);
  };
  if ("savepoint" in sql) await sql.savepoint(replace);
  else await sql.begin(replace);
}
