import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Star,
} from "lucide-react";
import Container from "../common/Container.jsx";
import Reveal from "../common/Reveal.jsx";
import CountUp from "../common/CountUp.jsx";
import { iconShift, popStar, stagger, tapScale } from "../../lib/motion.js";

const DESCRIPTION =
  "Lapangan mini football dengan rumput sintetis berkualitas, pencahayaan malam, dan bench yang nyaman untuk pemain maupun penonton.";

const FIELDS = [
  {
    name: "Lapangan ANS Pancasila",
    description: DESCRIPTION,
    img: "/ans-pancasila.jpg",
    rating: 4.6,
    stars: 4.5,
    totalReviews: 72,
    mapsUrl: "https://maps.app.goo.gl/D2mjZw7kxAzXndnN9",
  },
  {
    name: "Lapangan ANS Untan",
    description: DESCRIPTION,
    img: "/ans-untan.jpg",
    rating: 4.6,
    stars: 4.5,
    totalReviews: 23,
    mapsUrl: "https://maps.app.goo.gl/cDqNr8R6bvzcatGC6",
  },
];

const Stars = ({ count }) => (
  <motion.div
    variants={stagger(0.08)}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.5 }}
    className="flex gap-0.5"
    aria-hidden="true"
  >
    {[0, 1, 2, 3, 4].map((i) => {
      // 1 = penuh, 0 = kosong, 0<x<1 = bintang terisi sebagian (mis. 4.5)
      const fill = Math.min(Math.max(count - i, 0), 1);
      return (
        <motion.span
          key={i}
          variants={popStar}
          className="relative inline-block size-4 text-[#c9ccc6]"
        >
          <Star className="block size-full fill-current" />
          {fill > 0 && (
            <span
              className="absolute inset-y-0 left-0 overflow-hidden text-rating"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="block size-4 fill-current" />
            </span>
          )}
        </motion.span>
      );
    })}
  </motion.div>
);

const GAP = 16; // harus sama dengan gap-4 antar slide

const FieldCarousel = () => {
  const track = useRef(null);
  const busy = useRef(false);

  const count = FIELDS.length;
  const step = (el) => el.clientWidth + GAP;
  // Clone item terakhir di depan & item pertama di belakang, supaya bisa
  // loop dua arah dengan animasi tetap searah tombol. Setelah animasi,
  // posisi diam-diam dilompatkan kembali ke item asli (tanpa animasi).
  const slides = [FIELDS[count - 1], ...FIELDS, FIELDS[0]];

  useLayoutEffect(() => {
    const el = track.current;
    el.scrollTo({ left: step(el), behavior: "instant" }); // mulai di item asli pertama

    const onEnd = () => {
      busy.current = false;
      const s = step(el);
      const i = Math.round(el.scrollLeft / s);
      if (i <= 0) el.scrollTo({ left: count * s, behavior: "instant" });
      else if (i >= count + 1) el.scrollTo({ left: s, behavior: "instant" });
    };
    el.addEventListener("scrollend", onEnd);
    return () => el.removeEventListener("scrollend", onEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (dir) => {
    const el = track.current;
    if (!el || busy.current) return;
    busy.current = true;
    el.scrollBy({ left: dir * step(el), behavior: "smooth" });
    setTimeout(() => {
      busy.current = false; // fallback bila scrollend tidak didukung
    }, 700);
  };

  return (
    <section className="my-12 sm:my-16 lg:my-24" aria-labelledby="t-fields">
      <Container className="grid items-stretch gap-8 lg:grid-cols-[1fr_1.7fr]">
        <Reveal className="flex flex-col justify-between gap-8 md:flex-row md:items-end lg:flex-col lg:items-stretch">
          <div>
            <h2
              id="t-fields"
              className="text-h2 font-bold leading-[1.1] tracking-tight text-balance"
            >
              Pilih Lapangan yang Cocok untuk Timmu
            </h2>
            <p className="mt-4 max-w-sm text-pretty text-muted-foreground">
              Geser untuk melihat lapangan yang tersedia, lengkap dengan lokasi
              di Google Maps.
            </p>
          </div>
          <div className="flex gap-2.5">
            <motion.button
              type="button"
              onClick={() => go(-1)}
              aria-label="Lapangan sebelumnya"
              variants={tapScale}
              initial={false}
              whileHover="hover"
              whileTap="tap"
              className="grid size-12 cursor-pointer place-items-center rounded-full border border-border bg-card text-foreground transition-colors duration-200 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-5" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => go(1)}
              aria-label="Lapangan berikutnya"
              variants={tapScale}
              initial={false}
              whileHover="hover"
              whileTap="tap"
              className="grid size-12 cursor-pointer place-items-center rounded-full border border-primary bg-primary text-primary-foreground transition-colors duration-200 hover:border-green-500 hover:bg-green-500 active:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowRight className="size-5" />
            </motion.button>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <div
            ref={track}
            tabIndex={0}
            aria-label="Daftar lapangan"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((field, i) => {
              const isClone = i === 0 || i === count + 1;
              return (
                <article
                  key={i}
                  aria-hidden={isClone || undefined}
                  inert={isClone || undefined}
                  className="grid flex-[0_0_100%] snap-start gap-4 rounded-2xl bg-card p-4 sm:grid-cols-2 sm:gap-5"
                >
                  <img
                    src={field.img}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full rounded-lg bg-cream-200 object-cover sm:aspect-[4/3]"
                  />
                  <div className="flex flex-col justify-between gap-5 sm:py-2 sm:pr-2">
                    <div>
                      <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold">
                        <MapPin className="size-4" />
                        ANS Mini Football
                      </span>
                      <h3 className="mt-3 mb-2 text-h3 font-bold leading-[1.1] tracking-tight text-balance">
                        {field.name}
                      </h3>
                      <p className="text-pretty text-sm text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <CountUp
                          to={field.rating}
                          decimals={1}
                          className="block text-[clamp(2rem,3vw,2.5rem)] font-bold leading-none tracking-tight"
                        />
                        <div className="my-1.5">
                          <Stars count={field.stars} />
                        </div>
                        <small className="text-sm text-muted-foreground">
                          {field.totalReviews} Reviews
                        </small>
                      </div>
                      <motion.a
                        href={field.mapsUrl}
                        target="_blank"
                        rel="noopener"
                        aria-label={`Buka ${field.name} di Google Maps`}
                        variants={tapScale}
                        initial={false}
                        whileHover="hover"
                        whileTap="tap"
                        className="grid size-12 cursor-pointer place-items-center rounded-full border border-primary bg-primary text-primary-foreground transition-colors duration-200 hover:border-green-500 hover:bg-green-500 active:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <motion.span variants={iconShift}>
                          <ArrowUpRight className="size-5" />
                        </motion.span>
                      </motion.a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
};

export default FieldCarousel;
