import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Container from "../common/Container.jsx";
import { DUR, EASE, iconShift, tapScale } from "../../lib/motion.js";
import { NAV_LINKS, WHATSAPP_URL } from "../../lib/constants.js";

const ContactButton = ({ className = "" }) => (
  <motion.a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noopener"
    variants={tapScale}
    initial={false}
    whileHover="hover"
    whileTap="tap"
    className={`inline-flex cursor-pointer items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
  >
    Hubungi Kami
    <motion.span
      variants={iconShift}
      className="grid size-9 place-items-center rounded-full bg-primary text-white"
    >
      <ArrowUpRight className="size-4" />
    </motion.span>
  </motion.a>
);

const Links = ({ onNavigate }) => (
  <>
    {NAV_LINKS.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.to === "/"}
        onClick={onNavigate}
        className={({ isActive }) =>
          `px-2 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:p-0 ${
            isActive ? "font-bold" : "opacity-85 hover:opacity-100"
          }`
        }
      >
        {link.label}
      </NavLink>
    ))}
  </>
);

const Navbar = ({ solid = false }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  // "solid" memaksa gaya latar terang untuk halaman non-hero (mis. Pesan Lapangan)
  const isSolid = solid || scrolled;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: DUR.base, ease: EASE }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        isSolid
          ? "bg-white/80 text-foreground shadow-soft backdrop-blur-md"
          : "bg-transparent text-white"
      }`}
    >
      <Container className="relative">
        <div className="flex items-center justify-between gap-4 py-5">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            ANS Mini Football
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden flex-1 items-center justify-center gap-8 md:flex"
          >
            <Links />
          </nav>

          <ContactButton className="max-md:hidden" />

          <motion.button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            variants={tapScale}
            initial={false}
            whileHover="hover"
            whileTap="tap"
            className={`grid size-11 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring block md:hidden ${
              isSolid
                ? "border border-border bg-white text-foreground shadow-soft"
                : "border border-white/50 bg-white/15"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "open"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: DUR.fast, ease: EASE }}
                className="grid place-items-center"
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="menu"
              aria-label="Navigasi utama"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DUR.fast, ease: EASE }}
              className="absolute inset-x-0 top-full z-20 flex flex-col items-stretch gap-1 rounded-xl border border-(--glass-border) bg-(--glass-bg) p-4 text-foreground shadow-float backdrop-blur-(--glass-blur) md:hidden"
            >
              <Links onNavigate={() => setOpen(false)} />
              <ContactButton className="mt-2 self-start" />
            </motion.nav>
          )}
        </AnimatePresence>
      </Container>
    </motion.header>
  );
};

export default Navbar;
