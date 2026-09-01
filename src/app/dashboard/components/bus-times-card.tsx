import { useEffect, useState } from "react";
import { Bus, RefreshCw, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCtaBus } from "@/hooks/useCtaBus";
import { formatArrivalCountdown } from "@/services/ctaBus";
import { cn } from "@/lib/utils";

function formatFetchCountdown(targetMs: number, now: number): string {
  const remainingMs = Math.max(0, targetMs - now);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function BusTimesCard() {
  const {
    predictions,
    lastFetchedAt,
    nextFetchAt,
    live,
    loading,
    refreshing,
    error,
    refresh,
    stopLive,
  } = useCtaBus();
  const [now, setNow] = useState(() => Date.now());
  const busy = loading || refreshing;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bus className="size-4" />
          Buses
          {nextFetchAt !== null && (
            <span className="text-sm text-muted-foreground font-mono">
              {formatFetchCountdown(nextFetchAt, now)}
            </span>
          )}
          {nextFetchAt === null && lastFetchedAt !== null && !live && (
            <span className="text-sm text-muted-foreground">Paused</span>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {live && (
            <>
              <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={stopLive}
              aria-label="Stop live updates"
            >
              <X className="size-4" />
            </Button>
            <Badge variant="outlinePrimary">
              Live
            </Badge>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={busy}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !predictions && (
          <p className="text-sm text-muted-foreground">Loading bus times…</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {predictions && !error && (
          <div className="grid grid-cols-2 gap-4">
            {predictions.routes.map((route, index) => (
              <div key={`${route.rt}-${route.stpid}`} className={cn("min-w-0", index === 0 ? "text-accent" : "text-primary")}>
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
                    {route.arrivals.map((arrival, arrivalIndex) => (
                      <li
                        key={`${route.stpid}-${arrival.prdtm}-${arrivalIndex}`}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="truncate text-muted-foreground">
                          {arrival.des || "—"}
                          {arrival.dly ? " · delayed" : ""}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatArrivalCountdown(
                            arrival.prdctdn,
                            lastFetchedAt ?? undefined,
                            now
                          )}
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
