import { useState, useEffect } from "react";
import { useStorageValue } from "./useStorageValue";
import { clockFormatItem, showDateItem } from "@/lib/settings";

export function Clock({ compact }: { compact: boolean }) {
  const [time, setTime] = useState(() => new Date());

  const format = useStorageValue(clockFormatItem);
  const showDate = useStorageValue(showDateItem);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const now = new Date();
      setTime(now);

      const delay = 1000 - (Date.now() % 1000);
      timeoutId = setTimeout(tick, delay);
    };

    const delay = 1000 - (Date.now() % 1000);
    timeoutId = setTimeout(tick, delay);

    return () => clearTimeout(timeoutId);
  }, []);

  if (format === undefined) return null;

  const twelveHour = format === "12h";
  const hours = String(
    twelveHour ? time.getHours() % 12 || 12 : time.getHours(),
  );
  // const period = time.getHours() < 12 ? "AM" : "PM";

  const minutes = String(time.getMinutes()).padStart(2, "0");

  const date = time.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`flex items-center text-center ${compact ? "flex-col" : "flex-col-reverse"}`}
    >
      {showDate === true && <p className="date">{date}</p>}
      <h1 className={`clock ${compact ? "clock-compact" : ""}`}>
        {hours}
        <span className="colon">:</span>
        {minutes}
        {/* {twelveHour && <span className="clock-period">{period}</span>} */}
      </h1>
    </div>
  );
}
