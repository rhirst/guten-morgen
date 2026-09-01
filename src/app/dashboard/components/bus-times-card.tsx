import { Bus, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCtaBus } from "@/hooks/useCtaBus";
import { formatArrivalCountdown } from "@/services/ctaBus";
import { cn } from "@/lib/utils";

export function BusTimesCard() {
  const { predictions, loading, refreshing, error, refresh } = useCtaBus();
  const busy = loading || refreshing;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bus className="size-4" />
          Buses
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={refresh}
          disabled={busy}
          aria-label="Refresh bus times"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !predictions && (
          <p className="text-sm text-muted-foreground">Loading bus times…</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {predictions && !error && (
          <div className="grid grid-cols-2 gap-2">
            {predictions.routes.map((route) => (
              <div key={`${route.rt}-${route.stpid}`} className="min-w-0">
                <p className="text-sm font-semibold">
                  {route.rt} {route.rtdir}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {route.stpnm}
                </p>
                {route.arrivals.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No upcoming buses
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {route.arrivals.map((arrival, index) => (
                      <li
                        key={`${route.stpid}-${arrival.prdtm}-${index}`}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="truncate text-muted-foreground">
                          {arrival.des || "—"}
                          {arrival.dly ? " · delayed" : ""}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatArrivalCountdown(arrival.prdctdn)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
