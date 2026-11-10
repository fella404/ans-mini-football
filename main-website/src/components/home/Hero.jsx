import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, Clock, MapPin, Timer } from "lucide-react";
import toast from "react-hot-toast";
import Container from "../common/Container.jsx";
import { fadeUp, stagger, iconShift, tapScale, EASE } from "../../lib/motion.js";
import api from "../../lib/api.js";

const today = new Date().toLocaleDateString("sv-SE");

const SlotField = ({ icon: Icon, children }) => (
  <label className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-3 text-primary focus-within:outline-2 focus-within:outline-primary">
    <Icon className="size-4 shrink-0" />
    {children}
  </label>
);

const fieldInput =
  "w-full border-0 bg-transparent text-sm font-medium text-foreground outline-none";

const Hero = () => {
  const [fields, setFields] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/fields"), api.get("/time-slots")])
      .then(([fieldsRes, slotsRes]) => {
        setFields(fieldsRes.data.data);
        setSlots(slotsRes.data.data);
      })
      .catch(() => toast.error("Gagal memuat data lapangan"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="home"
      className="relative isolate flex min-h-[min(100svh,54rem)] flex-col justify-between overflow-hidden bg-[#274a2c] pt-[5.25rem] text-white"
    >
      <motion.img
        src="/bg.jpeg"
        alt=""
        aria-hidden="true"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: EASE }}
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/60 via-black/15 via-45% to-black/60" />

      <motion.div
        variants={stagger(0.12, 0.15)}
        initial="hidden"
        animate="show"
        className="contents"
      >
        <Container className="pt-12 pb-4 flex flex-col items-center md:block">
          <motion.span
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/18 px-4 py-1.5 text-sm font-medium backdrop-blur-[10px]"
          >
            <MapPin className="size-4" />
            Mini Football Terbaik di Pontianak
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="max-w-[13ch] text-balance text-center md:text-left text-hero font-extrabold leading-[1.1] tracking-tight"
          >
            Pesan Lapangan Mini Football Favoritmu
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[32rem] text-pretty text-center md:text-left text-white/90"
          >
            Cek slot kosong, pilih jam main, dan bayar langsung dari ponselmu.
            Tanpa chat berulang, tanpa bentrok jadwal.
          </motion.p>
        </Container>

        <Container>
          <motion.div
            variants={fadeUp}
            className="mb-5 rounded-3xl border border-(--glass-border) bg-(--glass-bg) px-5 py-5 shadow-float backdrop-blur-(--glass-blur) sm:mb-8 sm:px-6"
          >
          <h2 className="mb-4 text-lg font-bold leading-[1.1] tracking-tight text-balance">
            Booking Slot Cepat
          </h2>
          <form
            action="/pesan-lapangan"
            method="get"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)_auto]"
          >
            <SlotField icon={MapPin}>
              <select
                name="lapangan"
                aria-label="Pilih lapangan"
                disabled={loading}
                className={fieldInput}
              >
                {loading ? (
                  <option value="">Memuat…</option>
                ) : (
                  fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))
                )}
              </select>
            </SlotField>

            <SlotField icon={Calendar}>
              <input
                type="date"
                name="tanggal"
                aria-label="Tanggal main"
                min={today}
                defaultValue={today}
                required
                className={fieldInput}
              />
            </SlotField>

            <SlotField icon={Clock}>
              <select
                name="jam"
                aria-label="Jam mulai"
                disabled={loading}
                className={fieldInput}
              >
                {loading ? (
                  <option value="">Memuat…</option>
                ) : (
                  slots.map((slot) => (
                    <option key={slot.id} value={slot.start_time.slice(0, 5)}>
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </option>
                  ))
                )}
              </select>
            </SlotField>

            <SlotField icon={Timer}>
              <select name="durasi" aria-label="Durasi main" className={fieldInput}>
                <option value="1">1 Jam</option>
                <option value="2">2 Jam</option>
                <option value="3">3 Jam</option>
                <option value="4">4 Jam</option>
              </select>
            </SlotField>

            <motion.button
              type="submit"
              disabled={loading}
              variants={tapScale}
              initial={false}
              whileHover="hover"
              whileTap="tap"
              className="col-span-full inline-flex cursor-pointer items-center justify-between gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-1"
            >
              Konfirmasi
              <motion.span
                variants={iconShift}
                className="grid size-9 place-items-center rounded-full bg-white text-primary"
              >
                <ArrowUpRight className="size-4" />
              </motion.span>
            </motion.button>
          </form>
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
};

export default Hero;
