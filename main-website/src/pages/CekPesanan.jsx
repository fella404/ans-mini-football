import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/layout/Navbar.jsx";
import api from "../lib/api.js";
import { iconShift, tapScale } from "../lib/motion.js";

const CekPesanan = () => {
  const navigate = useNavigate();
  const [kode, setKode] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const code = kode;
    if (!code || checking) return;
    setChecking(true);
    try {
      await api.get(`/bookings/${code}`);
      navigate(`/booking-detail?kode=${code}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Kode booking tidak ditemukan");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="grid place-items-center px-5 pt-32 pb-16">
        <section className="w-full max-w-2xl rounded-2xl bg-card p-6 sm:p-10">
          <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight">
            Cek Pesanan
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Masukkan kode booking untuk melihat status pesanan
          </p>

          <form noValidate onSubmit={submit} className="mt-7">
            <label
              htmlFor="kode"
              className="mb-2.5 block text-sm font-semibold"
            >
              Kode Booking
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="kode"
                type="text"
                value={kode}
                onChange={(e) =>
                  setKode(e.target.value.toUpperCase().replace(/\s+/g, ""))
                }
                placeholder="Contoh: A3D6XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                className="w-full flex-1 rounded-xl border border-input bg-white px-4 py-3 text-base font-semibold uppercase tracking-wider text-foreground outline-none transition-colors placeholder:text-sm placeholder:font-medium placeholder:normal-case placeholder:tracking-normal focus:border-primary"
              />
              <motion.button
                type="submit"
                variants={tapScale}
                initial={false}
                whileHover="hover"
                whileTap="tap"
                disabled={checking || !kode}
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-5 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-45"
              >
                {checking ? "Memeriksa…" : "Cek"}
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-primary">
                  {checking ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <motion.span variants={iconShift} className="grid place-items-center">
                      <ArrowUpRight className="size-4" />
                    </motion.span>
                  )}
                </span>
              </motion.button>
            </div>
          </form>

          <p className="mt-6 border-t border-dashed border-border pt-5 text-sm text-muted-foreground">
            Kode booking dikirim setelah kamu memesan lapangan
          </p>
        </section>
      </main>
    </div>
  );
};

export default CekPesanan;
