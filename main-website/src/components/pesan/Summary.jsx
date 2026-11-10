const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b border-dashed border-border py-2.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd
      className={`text-right font-semibold break-all ${value ? "" : "font-medium text-muted-foreground"}`}
    >
      {value || "—"}
    </dd>
  </div>
);

const Summary = ({ booking, total, amountDue, pricePerHour, showPayment }) => {
  const { field, date, jam, duration, name, phone, paymentType, dpPercentage } =
    booking;

  return (
    <aside
      aria-label="Ringkasan pesanan"
      aria-live="polite"
      className="sticky top-24 rounded-2xl bg-card p-5 sm:p-8 max-lg:static"
    >
      <h2 className="mb-2 text-xl font-bold tracking-tight">Ringkasan Pesanan</h2>
      <dl>
        <Row label="Lapangan" value={field?.name} />
        <Row
          label="Tanggal"
          value={
            date &&
            new Date(`${date}T00:00`).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          }
        />
        <Row label="Jam main" value={jam} />
        <Row label="Durasi" value={jam && `${duration} jam`} />
        <Row label="Nama" value={name.trim()} />
        <Row label="No. HP" value={phone.trim()} />
        {showPayment && (
          <Row
            label="Tipe bayar"
            value={paymentType === "dp" ? `DP ${dpPercentage}%` : "Bayar penuh"}
          />
        )}
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <span>Estimasi total</span>
        <strong className="text-2xl font-bold tracking-tight text-primary">
          {jam ? idr.format(total) : "—"}
        </strong>
      </div>

      {showPayment && jam ? (
        paymentType === "dp" ? (
          <small className="mt-1 block text-sm text-muted-foreground">
            Dibayar sekarang <b className="text-foreground">{idr.format(amountDue)}</b> ·
            sisa dilunasi di tempat
          </small>
        ) : (
          <small className="mt-1 block text-sm text-muted-foreground">
            Dibayar sekarang {idr.format(amountDue)}
          </small>
        )
      ) : (
        <small className="mt-1 block text-sm text-muted-foreground">
          {pricePerHour ? `${idr.format(pricePerHour)} per jam` : "Tarif mengikuti jam yang dipilih"}
        </small>
      )}
    </aside>
  );
};

export default Summary;
