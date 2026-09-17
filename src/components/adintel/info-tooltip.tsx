import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTooltip({ methodology }: { methodology: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground/70 hover:text-foreground" aria-label="How is this estimated?">
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium text-foreground">How is this estimated?</p>
        <p className="mt-1 text-muted-foreground">{methodology}</p>
      </TooltipContent>
    </Tooltip>
  );
}
