import { createEvents, EventAttributes } from "ics";

export interface JetlagEvent {
  id: string;
  title: string;
  eventType: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
}

export function generateICS(events: JetlagEvent[], organizationName?: string): string {
  const icsEvents: EventAttributes[] = events.map((event) => {
    const start = event.startTime;
    const end = event.endTime;

    return {
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ],
      end: [
        end.getFullYear(),
        end.getMonth() + 1,
        end.getDate(),
        end.getHours(),
        end.getMinutes(),
      ],
      title: event.title,
      description: event.description || `Jetlag recovery activity: ${event.eventType}`,
      location: event.location || "",
      status: "CONFIRMED" as const,
      busyStatus: "BUSY" as const,
      organizer: organizationName ? {
        name: organizationName,
      } : undefined,
      categories: ["Jetlag Recovery", event.eventType],
    };
  });

  const { error, value } = createEvents(icsEvents);

  if (error) {
    console.error("Error generating ICS:", error);
    throw new Error("Failed to generate ICS file");
  }

  return value || "";
}

export function downloadICS(icsContent: string, filename: string = "jetlag-recovery.ics"): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
