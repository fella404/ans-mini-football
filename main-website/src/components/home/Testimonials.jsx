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
import MotionLink from "../common/MotionLink.jsx";
import { iconShift, popStar, stagger, tapScale } from "../../lib/motion.js";

const TESTIMONIALS = [
  {
    quote:
      "“Lokasi lapangan mini soccer nya strategis ditengah kota Pontianak dengan lapangan parkir yang memadai dan bisa sewa sepatu bola juga”",
    name: "Erwin Febriansyah",
    team: "Customer ANS Mini Football",
    image: "/testimonials/testimonial-2.jpg",
  },
  {
    quote:
      "Manajemen yang sangat open, mendukung pembinaan usia dini. SSB boleh latihan disini. Sistem booking menggunakan web sehingga transparan dan terletak di tengah kota Pontianak.”",
    name: "Miftahhurrahman",
    team: "Pelatih SSB",
    image: "/testimonials/testimonial-3.jpg",
  },
  {
    quote:
      "lapangan mini soccer di tengah kota Pontianak. Lapangan nya oke, luas lapangan nya sesuai standar. Bola nya lumayan enak, banyak bangku buat pemain cadangan maupun penonton dan parkiran luas.”",
    name: "Sukiran",
    team: "Customer ANS Mini Football",
    image: "/testimonials/testimonial-1.jpg",
  },
];

const GAP = 16; // harus sama dengan gap-4 antar slide

const Testimonials = () => {
  const track = useRef(null);
  const busy = useRef(false);

  const count = TESTIMONIALS.length;
  const step = (el) => el.clientWidth + GAP;
  // Clone item terakhir di depan & item pertama di belakang, supaya bisa
  // loop dua arah dengan animasi tetap searah tombol. Setelah animasi,
  // posisi diam-diam dilompatkan kembali ke item asli (tanpa animasi).
  const slides = [TESTIMONIALS[count - 1], ...TESTIMONIALS, TESTIMONIALS[0]];

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
    <section className="my-12 sm:my-16 lg:my-20" aria-labelledby="t-testi">
      <Container>
        <Reveal className="mb-6 flex flex-wrap items-start justify-between gap-x-8 gap-y-5 md:flex-nowrap md:items-center">
          <h2
            id="t-testi"
            className="max-w-[22ch] text-h2 font-bold leading-[1.1] tracking-tight text-balance"
          >
            Pengalaman Mereka Main di ANS Mini Football
          </h2>
          <div className="flex max-w-xs flex-col items-start gap-3">
            <p className="text-pretty text-muted-foreground">
              Lihat apa kata mereka tentang pengalaman bermain di tempat kami.
            </p>
            <MotionLink
              to="/pesan-lapangan"
              variants={tapScale}
              initial={false}
              whileHover="hover"
              whileTap="tap"
              className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Pesan Sekarang
              <motion.span
                variants={iconShift}
                className="grid size-9 place-items-center rounded-full bg-white text-primary"
              >
                <ArrowUpRight className="size-4" />
              </motion.span>
            </MotionLink>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            ref={track}
            tabIndex={0}
            aria-label="Daftar testimoni"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((item, i) => {
              const isClone = i === 0 || i === count + 1;
              return (
                <div
                  key={i}
                  aria-hidden={isClone || undefined}
                  inert={isClone || undefined}
                  className="grid flex-[0_0_100%] snap-start gap-4 lg:grid-cols-[1fr_2fr]"
                >
                  <div className="relative min-h-52 overflow-hidden rounded-2xl bg-[#274a2c]">
                    <img
                      src={item.image}
                      alt={`Pemain mini football - ${item.name}`}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>

                  <figure className="flex flex-col justify-between gap-8 rounded-2xl bg-card p-5 sm:p-8">
                    <blockquote className="text-[clamp(1.1rem,2vw,1.5rem)] font-medium leading-snug tracking-tight">
                      {item.quote}
                    </blockquote>
                    <figcaption className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <b>{item.name}</b>
                        <span className="flex items-center gap-1.5 text-[0.8rem] font-medium text-muted-foreground">
                          <MapPin className="size-4" />
                          {item.team}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <CountUp
                          to={5}
                          decimals={1}
                          className="text-[clamp(1.75rem,3vw,2.5rem)] leading-none"
                        />
                        <motion.div
                          variants={stagger(0.08)}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true, amount: 0.5 }}
                          className="mt-1 flex gap-0.5 sm:justify-end"
                          aria-hidden="true"
                        >
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.span key={i} variants={popStar}>
                              <Star className="size-4 fill-rating text-rating" />
                            </motion.span>
                          ))}
                        </motion.div>
                      </div>
                    </figcaption>
                  </figure>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal className="mt-5 flex justify-end gap-2.5">
          <motion.button
            type="button"
            onClick={() => go(-1)}
            aria-label="Testimoni sebelumnya"
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
            aria-label="Testimoni berikutnya"
            variants={tapScale}
            initial={false}
            whileHover="hover"
            whileTap="tap"
            className="grid size-12 cursor-pointer place-items-center rounded-full border border-primary bg-primary text-primary-foreground transition-colors duration-200 hover:border-green-500 hover:bg-green-500 active:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowRight className="size-5" />
          </motion.button>
        </Reveal>
      </Container>
    </section>
  );
};

export default Testimonials;
