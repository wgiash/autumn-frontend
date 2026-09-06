# Frontend Structure

Route files compose screens. Feature components own presentation and local UI
state; database access, API handlers, queries, and data contracts are separate
integration work and do not belong in this directory.

- `bookings-view.tsx` composes the filters, table, sidebar, and dialog in `bookings/`.
- `chart.tsx` composes the plot, tooltip, and legend. `chart/use-chart-interaction.ts`
  owns pointer selection and series motion; `chart/weekly-figures.tsx` renders the dialog.
- `rail.tsx` arranges the responsive action sections. `actions/action-card.tsx`
  owns a single action and its disclosure content.
- `ui/` contains shared visual primitives and presentation helpers. Use the
  existing tabs, disclosure summary, logo, easing, gradients, and currency formatters.
- `scroll-visibility.tsx` manages scroll edge tags and observer lifetimes across routes.
- Small sections such as the hero, savings, recent bookings, and navigation
  stay together when they have a single clear responsibility.

## Visual Contract

Refactors must preserve rendered markup, styling tokens, breakpoints, labels,
keyboard behavior, scroll positioning, and animation timing. Global styles and
the chart's styles stay in their established files to preserve cascade order.
Dialog backdrop styles intentionally remain inline because the stylesheet
pipeline strips their backdrop-filter declarations.

The `bookings/format.ts` export remains available for existing callers; its
implementation now lives in `ui/format.ts`.

## Verification

- `npm test`: pure frontend state, formatting, and presentation tests.
- `npm run typecheck`: regenerate route types, then check TypeScript.
- `npm run lint`: frontend and project lint checks.
- `npm run test:e2e`: browser interactions and visual checks at desktop, tablet,
  and phone sizes, against the running app on port 3200 (or `PLAYWRIGHT_BASE_URL`).

Install the test browser with `npx playwright install chromium`. To use an
installed Chrome instead, set `PLAYWRIGHT_CHANNEL=chrome`. The browser tests
exercise the August report; its data must be available in the running app.
Review screenshot differences before updating baselines. Error screens must
never become approved baselines.
