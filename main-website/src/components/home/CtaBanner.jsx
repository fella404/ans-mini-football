import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Container from "../common/Container.jsx";
import MotionLink from "../common/MotionLink.jsx";
import { DUR, EASE, iconShift, tapScale } from "../../lib/motion.js";

const lineUp = (delay) => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE, delay },
  },
});

const CtaBanner = () => {
  const ref = useRef(null);
  // Parallax ringan: gambar bergeser ±24px selama section melintasi viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);

  return (
    <section className="my-12 sm:my-16 lg:my-20" aria-labelledby="t-cta">
      <Container>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative isolate flex min-h-[clamp(26rem,52vw,34rem)] flex-col justify-between gap-8 overflow-hidden rounded-2xl bg-[#274a2c] p-5 text-white sm:p-8 lg:p-10"
        >
          <motion.img
            src="https://images.unsplash.com/flagged/photo-1550413231-202a9d53a331?auto=format&fit=crop&w=1800&q=80"
            alt=""
            aria-hidden="true"
            loading="lazy"
            style={{ y, scale: 1.1 }}
            className="absolute inset-0 -z-10 size-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/60 to-black/10" />

          <motion.h2
            id="t-cta"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-[13ch] text-[clamp(2rem,5vw,3.75rem)] text-balance font-bold leading-[1.1] tracking-tight"
          >
            <motion.span variants={lineUp(0)} className="block">
              Aman kan Jadwal Mu,
            </motion.span>
            <motion.span variants={lineUp(0.12)} className="block">
              Booking Slot Sekarang
            </motion.span>
          </motion.h2>

          <motion.div
            variants={lineUp(0.25)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="grid w-fit min-w-56 gap-4 rounded-3xl border border-(--glass-border) bg-white/85 p-5 text-foreground backdrop-blur-(--glass-blur)"
          >
            <b className="text-[1.05rem] leading-tight">
              Amankan Jadwal,
              <br />
              Pesan Sekarang
            </b>
            <MotionLink
              to="/pesan-lapangan"
              variants={tapScale}
              initial={false}
              whileHover="hover"
              whileTap="tap"
              className="inline-flex w-fit cursor-pointer items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Booking Jadwal
              <motion.span
                variants={iconShift}
                className="grid size-9 place-items-center rounded-full bg-white text-primary"
              >
                <ArrowUpRight className="size-4" />
              </motion.span>
            </MotionLink>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
};

export default CtaBanner;
