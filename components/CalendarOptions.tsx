"use client";

import type { Strings } from "@/lib/i18n";
import { CalendarDays } from "./icons";

export function CalendarOptions({ s, google, ics }: { s: Strings; google: string; ics: string }) {
  return (
    <details className="calendar-options">
      <summary className="text-button">
        <CalendarDays size={15} />
        {s.addToCalendar}
      </summary>
      <div className="calendar-choices">
        <a href={google} target="_top" rel="noopener noreferrer">
          Google Calendar
        </a>
        <a href={ics} target="_top">
          Apple Calendar / Outlook (.ics)
        </a>
        <p>{s.calendarHelp}</p>
      </div>
    </details>
  );
}
