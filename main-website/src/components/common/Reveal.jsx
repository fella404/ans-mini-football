import { motion } from "framer-motion";
import { DUR, EASE } from "../../lib/motion.js";

// Pola reveal tunggal untuk semua section non-hero: fade + naik saat masuk viewport.
const Reveal = ({
  delay = 0,
  y = 24,
  amount = 0.3,
  className = "",
  children,
  ...props
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: DUR.base, ease: EASE, delay },
      },
    }}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount }}
    {...props}
  >
    {children}
  </motion.div>
);

export default Reveal;
