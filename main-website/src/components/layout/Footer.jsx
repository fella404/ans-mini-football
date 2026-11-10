import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Container from "../common/Container.jsx";
import Reveal from "../common/Reveal.jsx";
import { NAV_LINKS, WHATSAPP_URL } from "../../lib/constants.js";

// lucide-react tidak punya brand icon, jadi pakai path SVG inline
const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com/",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/",
    path: "M16.5 2h-3v13.2a2.8 2.8 0 1 1-2.8-2.8c.3 0 .6 0 .8.1V9.4a6 6 0 1 0 5 5.9V8.6a6.7 6.7 0 0 0 4 1.3V6.8a3.8 3.8 0 0 1-4-4.8Z",
  },
  {
    label: "WhatsApp",
    href: WHATSAPP_URL,
    path: "M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 0 16 8 8 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4Zm-3.3 3.9c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.7 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5v-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.6Z",
  },
];

const Footer = () => {
  return (
    <footer className="my-5 sm:my-8 lg:my-10">
      <Container>
        <div className="rounded-2xl bg-card p-6 sm:p-10 lg:p-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <Reveal delay={0}>
              <div className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-tighter">
                ANS Mini Football
              </div>
              <p className="mt-2 text-pretty text-muted-foreground">
                Booking lapangan kapan saja, di mana saja.
              </p>
              <ul className="mt-5 flex items-center gap-3">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <motion.a
                      href={social.href}
                      target="_blank"
                      rel="noopener"
                      aria-label={social.label}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition-colors duration-200 hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="size-4"
                      >
                        <path d={social.path} />
                      </svg>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.08}>
              <nav aria-label="Navigasi footer">
                <h3 className="mb-3.5 text-[0.95rem] font-bold leading-[1.1] tracking-tight">
                  Navigasi
                </h3>
                <ul>
                  {NAV_LINKS.map((link) => (
                    <li
                      key={link.to}
                      className="mb-2 text-sm text-muted-foreground"
                    >
                      <Link
                        to={link.to}
                        className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Reveal>

            <Reveal delay={0.16}>
              <h3 className="mb-3.5 text-[0.95rem] font-bold leading-[1.1] tracking-tight">
                Media Sosial
              </h3>
              <ul>
                {SOCIALS.map((social) => (
                  <li
                    key={social.label}
                    className="mb-2 text-sm text-muted-foreground"
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener"
                      className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal
            delay={0.24}
            className="mt-10 border-t border-border pt-5 text-sm text-muted-foreground"
          >
            © 2026 ANS Mini Football. Hak cipta dilindungi.
          </Reveal>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
