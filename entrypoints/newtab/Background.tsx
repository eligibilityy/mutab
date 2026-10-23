import { Kawarp } from "@kawarp/core";

const RESOLUTION = 0.5;

type BackgroundProps = {
  coverUrl: string | null;
  active: boolean;
};

export function Background({ coverUrl, active }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kawarpRef = useRef<Kawarp | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const kawarp = new Kawarp(canvas, {
      warpIntensity: 1,
      blurPasses: 8,
      animationSpeed: 0.1,
      saturation: 1.5,
      dithering: 0.008,
      transitionDuration: 500,
      tintIntensity: 0,
      scale: 1,
    });
    kawarpRef.current = kawarp;

    const observer = new ResizeObserver(() => {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION));
      kawarp.resize();
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      kawarp.dispose();
      kawarpRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!coverUrl) return;
    kawarpRef.current
      ?.loadImage(coverUrl)
      .catch((error) => console.error("Failed to load cover image:", error));
  }, [coverUrl]);

  useEffect(() => {
    const kawarp = kawarpRef.current;
    if (!kawarp) return;

    if (active) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      kawarp.animationSpeed = reduceMotion ? 0.1 : 1;
      kawarp.start();
    } else {
      kawarp.stop();
    }
  }, [active]);
  return (
    <div className={`background ${active ? "visible" : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
