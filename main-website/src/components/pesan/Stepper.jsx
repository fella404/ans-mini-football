import { Check } from "lucide-react";

const STEPS = ["Jadwal", "Data Diri", "Konfirmasi"];

const Stepper = ({ current }) => (
  <ol className="mb-8 flex items-center gap-3" aria-label="Langkah pemesanan">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <li
          key={label}
          className={`flex items-center gap-2.5 text-sm font-semibold ${
            n <= current ? "text-foreground" : "text-muted-foreground"
          } ${n < STEPS.length ? "flex-1" : ""}`}
        >
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${
              done
                ? "border-primary bg-green-50 text-primary"
                : active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
            }`}
          >
            {done ? <Check className="size-4" /> : n}
          </span>
          <span className="max-sm:text-xs">{label}</span>
          {n < STEPS.length && (
            <span
              className={`h-0.5 min-w-4 flex-1 rounded-full ${done ? "bg-primary" : "bg-border"}`}
            />
          )}
        </li>
      );
    })}
  </ol>
);

export default Stepper;
