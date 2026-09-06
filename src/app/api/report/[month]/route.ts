import type { MonthKey } from "@/lib/contracts";
import { getAvailableMonths, getMonthData } from "@/lib/queries";

export const revalidate = 3600;

/* one CSV cell: quote anything that would break the row */
function cell(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const COLUMNS = [
  "id",
  "guest",
  "city",
  "channel",
  "referral",
  "attributed",
  "booked",
  "arrival",
  "nights",
  "guests",
  "room",
  "status",
  "device",
  "value",
  "fee",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  const { month } = await params;
  const months = await getAvailableMonths();
  if (!months.some((m) => m.value === month))
    return new Response("Not found", { status: 404 });

  const { bookings } = await getMonthData(month as MonthKey);
  const csv = [
    COLUMNS.join(","),
    ...bookings.map((booking) =>
      COLUMNS.map((column) => cell(booking[column])).join(","),
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${month}.csv"`,
    },
  });
}
