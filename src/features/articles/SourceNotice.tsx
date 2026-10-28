import { CircleAlert } from "lucide-react";
import type { SourceId } from "@/domain/types";
import type { SkippedSource } from "@/services/aggregator";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { getSourceDisplay } from "./sourceConfig";

interface SourceNoticeProps {
  failedSources: SourceId[];
  skippedSources: SkippedSource[];
}

// Non-blocking: shown next to the results from the sources that did answer.
export function SourceNotice({
  failedSources,
  skippedSources,
}: SourceNoticeProps) {
  if (failedSources.length === 0 && skippedSources.length === 0) return null;

  return (
    <Alert>
      <CircleAlert aria-hidden="true" />
      <AlertTitle>Some sources aren't included</AlertTitle>
      <AlertDescription>
        <ul>
          {failedSources.map((id) => (
            <li key={id}>
              {getSourceDisplay(id).label} is unavailable right now.
            </li>
          ))}
          {/* The adapter's reason already names the source. */}
          {skippedSources.map(({ id, reason }) => (
            <li key={id}>{reason}.</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
