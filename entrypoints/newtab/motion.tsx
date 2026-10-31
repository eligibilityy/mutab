import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useMeasuredHeight } from "./useMeasure";

// Same curve as --ease-out in style.css, so CSS and Motion feel alike
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Springs keep their velocity when interrupted, so switching views mid-resize
// carries on smoothly instead of restarting. No bounce: fluid, not wobbly.
export const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;
export const FADE = { duration: 0.2, ease: EASE_OUT } as const;

// Content swaps blur out while the container resizes, then the new content
// blurs in, so the two never visibly overlap as hard edges.
export function useSwapAnimation() {
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.97, filter: "blur(4px)" };

  return {
    initial: hidden,
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: hidden,
    transition: FADE,
  };
}

// Measures the inner element and animates the outer one's height to match.
// Never measure and animate the same element, or the two feed back into each other.
export function AnimatedHeight({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [ref, height] = useMeasuredHeight<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="animated-height"
      initial={false}
      animate={{ height: height > 0 ? height : "auto" }}
      transition={reduceMotion ? { duration: 0 } : SPRING}
    >
      <div ref={ref} className={className}>
        {children}
      </div>
    </motion.div>
  );
}
