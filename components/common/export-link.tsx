import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A plain download link: the browser sends the session cookie and saves the CSV, so
 * no client JavaScript is needed. `label` is the accessible name; "CSV" is visible.
 */
export function ExportLink({
  href,
  label,
  disabled = false,
}: {
  href: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="outline" disabled aria-label={label}>
        <Download className="h-4 w-4" aria-hidden />
        CSV
      </Button>
    );
  }
  return (
    <Button asChild variant="outline">
      <a href={href} download aria-label={label}>
        <Download className="h-4 w-4" aria-hidden />
        CSV
      </a>
    </Button>
  );
}
