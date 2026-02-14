import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/hooks/useInView';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0, duration = 1200, className = '' }: Props) => {
  const { ref, inView } = useInView();
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);
  const startTime = useRef<number>(0);
  const startValue = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;

    startValue.current = display;
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue.current + (value - startValue.current) * eased;
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, inView, duration]);

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default AnimatedNumber;
