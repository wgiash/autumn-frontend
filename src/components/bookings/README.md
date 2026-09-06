# Bookings

`../bookings-view.tsx` composes the page and opens its analytics dialog. Keep
booking-specific behavior in this directory rather than expanding the page view.

- `model.ts`: pure filtering, sorting, totals, menu options, and state transitions.
- `use-bookings.ts`: React state and the table's scroll/sticky-header integration.
- `booking-filters.tsx` and `filter-select.tsx`: responsive filter layouts and menu motion.
- `booking-table.tsx` and `booking-row.tsx`: list rendering, sort headers, pagination, and receipts.
- `insight-dialog.tsx`, `insight-panels.tsx`, and `insight-sidebar.tsx`: dialog shell and the two analytics presentations.
- `insight-data.ts`: shared panel titles and scope-label formatting.

The route supplies reservations, insight values, and report labels as props.
The feature does not fetch data. `../bookings-data.ts` remains a test fixture.
Popup styles remain in `../booking-insights.module.css`; tabs and disclosures
use the shared UI components.

## Behavior And Checks

The list starts with 10 reservations and adds 15 on Show more. Filters reset that
limit; sorting preserves it. Filter choices come from the complete dataset, so a
zero-result combination never removes the choices needed to recover.

Run `npm test`, `npm run typecheck`, and `npm run lint` from the project root.
Tests use the project's `tsx` loader with Node's built-in test runner.
They cover state transitions, sorting ties, combined filters, pagination, totals,
and immutability. Browser tests also cover the pop-ups and responsive layouts.
