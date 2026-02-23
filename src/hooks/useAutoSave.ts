import { useEffect, useRef } from 'react';

export const useAutoSave = (
  save: () => void,
  deps: any[],
  delay = 2000
) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, deps);
};
