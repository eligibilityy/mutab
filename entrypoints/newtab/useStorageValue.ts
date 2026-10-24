import type { WxtStorageItem } from "wxt/utils/storage";

export function useStorageValue<T, M extends Record<string, unknown>>(
  item: WxtStorageItem<T, M>,
) {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let ignore = false;
    item.getValue().then((stored) => {
      if (!ignore) setValue(stored);
    });
    const unwatch = item.watch((next) => setValue(next));

    return () => {
      ignore = true;
      unwatch();
    };
  }, [item]);

  return value;
}
