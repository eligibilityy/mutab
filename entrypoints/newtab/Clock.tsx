import { useState, useEffect } from "react";

export function Clock({ compact }: { compact: boolean }) {
  const [time, setTime] = useState(() => new Date());

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

  const hours = String(time.getHours());
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
      <p className="date">{date}</p>
      <h1 className={`clock ${compact ? "clock-compact" : ""}`}>
        {hours}
        <span className="colon">:</span>
        {minutes}
      </h1>
    </div>
  );
}
