import { useEffect, useState } from "react";

function formatClock(date: Date, clockFormat: string) {
  const hour12 = clockFormat !== "24h" && clockFormat !== "24";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12,
  }).format(date);
}

export function LiveClock({ clockFormat }: { clockFormat: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-5xl font-semibold tabular-nums tracking-tight">
      {formatClock(now, clockFormat)}
    </p>
  );
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
