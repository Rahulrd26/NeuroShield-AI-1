import React, { useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'framer-motion';

export interface CountUpProps {
  value: number;
  from?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * High-performance count-up animation component powered by framer-motion.
 * Directly animates a MotionValue and updates DOM textContent without re-rendering React on every frame.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  from = 0,
  duration = 1.4,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const count = useMotionValue(from);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    // Set initial text
    const formatValue = (num: number) => {
      const formatted = decimals > 0 
        ? num.toFixed(decimals) 
        : Math.round(num).toLocaleString();
      return `${prefix}${formatted}${suffix}`;
    };

    node.textContent = formatValue(from);

    // Subscribe to motion value updates to avoid full React re-renders
    const unsubscribe = count.on('change', (latest) => {
      if (node) {
        node.textContent = formatValue(latest);
      }
    });

    // Smooth count-up animation with cubic bezier ease-out
    const controls = animate(count, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    });

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [value, from, duration, delay, decimals, prefix, suffix, count]);

  const initialDisplay = `${prefix}${decimals > 0 ? from.toFixed(decimals) : from.toLocaleString()}${suffix}`;

  return (
    <span ref={spanRef} className={className}>
      {initialDisplay}
    </span>
  );
};

export default CountUp;
