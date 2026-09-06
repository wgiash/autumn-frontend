import type { RefObject } from "react";
import type { InsightsData } from "@/lib/contracts";
import { Close } from "@/components/icons";
import insights from "../booking-insights.module.css";
import { INSIGHT_PANELS, panelScope, type InsightPanelKey } from "./insight-data";
import { BookingInsightPanel } from "./insight-panels";

import { DIALOG_BACKDROP_CSS } from "@/components/ui/dialog-backdrop";

export function BookingInsightDialog({
  panel,
  panelRef,
  data,
  monthLabel,
}: {
  panel: InsightPanelKey | null;
  panelRef: RefObject<HTMLDialogElement | null>;
  data: InsightsData;
  monthLabel: string;
}) {
  const active = INSIGHT_PANELS.find((item) => item.key === panel);
  return (
    <>
      <dialog
        ref={panelRef}
        aria-labelledby="booking-insight-title"
        aria-describedby="booking-insight-scope"
        /* no onClose reset: the body persists so the close animation keeps
           its height instead of collapsing on an emptied panel */
        onClick={(e) => {
          if (e.target === panelRef.current) panelRef.current.close();
        }}
        className={`figures-dialog ${insights.dialog}`}
      >
        <div className={insights.frame}>
          <header className={insights.header}>
            <div>
              <p className={insights.eyebrow}>{monthLabel}</p>
              <h2 id="booking-insight-title">{active?.title}</h2>
              <p id="booking-insight-scope" className={insights.scope}>
                {active && panelScope(active.key, data)}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              title="Close"
              autoFocus
              onClick={() => panelRef.current?.close()}
              className={insights.close}
            >
              <Close size={18} />
            </button>
          </header>
          <div key={panel} className={insights.body}>
            <BookingInsightPanel panel={panel} data={data} monthLabel={monthLabel} />
          </div>
        </div>
      </dialog>
      <style>{DIALOG_BACKDROP_CSS}</style>
    </>
  );
}
