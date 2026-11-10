// Preset animasi terpusat — satu sumber nilai durasi, easing, dan jarak.
export const EASE = [0.22, 1, 0.36, 1];
export const DUR = { fast: 0.3, base: 0.55, slow: 0.8 };

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE },
  },
};

export const stagger = (step = 0.12, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
});

export const popStar = {
  hidden: { opacity: 0, scale: 0.4 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.fast, ease: EASE },
  },
};

export const tapScale = {
  hover: { scale: 1.03, transition: { duration: DUR.fast, ease: EASE } },
  tap: { scale: 0.97, transition: { duration: DUR.fast, ease: EASE } },
};

// Ikon panah di dalam tombol bergeser kanan-atas saat parent di-hover.
export const iconShift = {
  hover: { x: 2, y: -2, transition: { duration: DUR.fast, ease: EASE } },
};
