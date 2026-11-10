import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { EASE } from "../../lib/motion.js";

// Angka berhitung naik dari 0 saat masuk viewport (sekali, lalu diam).
const CountUp = ({ to, decimals = 0, duration = 0.9, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, to, { duration, ease: EASE, onUpdate: setVal });
    return () => controls.stop();
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {(reduced ? to : val).toFixed(decimals)}
    </span>
  );
};

export default CountUp;
