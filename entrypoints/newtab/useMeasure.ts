// Tracks an element's rendered height. Measure an inner element and animate
// its wrapper, never the same element, or the two feed back into each other.
export function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      // offsetHeight ignores transforms, so the popup's exit scale doesn't count
      setHeight(element.offsetHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}
