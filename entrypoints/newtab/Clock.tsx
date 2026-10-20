import { useState, useEffect, useRef } from "react";

export function Clock() {
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

  return (
    <div className="flex flex-col text-6xl">
      <div>
        {time.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>
      <div className="flex">
        {hours}
        <span className="opacity-40">:</span>
        {minutes}
      </div>
    </div>
  );
}
