import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import type { EmployeeEventDto } from "@/lib/services/employee-events";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const TYPE_LABEL: Record<EmployeeEventDto["type"], string> = {
  UPDATED: "Details updated",
  TERMINATED: "Terminated",
  REINSTATED: "Reinstated",
};

/** Non-salary audit trail: who changed what, when, and why. */
export function EmployeeEventsList({ events }: { events: EmployeeEventDto[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No changes since this employee was added."
      />
    );
  }

  return (
    <ol className="divide-y">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-2 px-6 py-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant={event.type === "TERMINATED" ? "secondary" : "outline"}>
              {TYPE_LABEL[event.type]}
            </Badge>
            <time dateTime={event.changedAt} className="tabular-nums">
              {dateFormat.format(new Date(event.changedAt))}
            </time>
            <span className="text-muted-foreground">
              by {event.changedBy?.name ?? "System"}
            </span>
          </div>
          {event.reason && <p>{event.reason}</p>}
          {event.changes && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
              {Object.entries(event.changes).map(([field, { from, to }]) => (
                <div key={field} className="contents">
                  <dt className="text-muted-foreground">{field}</dt>
                  <dd>
                    <span className="text-muted-foreground line-through">{from}</span>{" "}
                    <span aria-hidden>→</span>
                    <span className="sr-only">changed to</span> {to}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ol>
  );
}
