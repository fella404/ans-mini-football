import { slotKey, isSlotEnded } from "@/lib/schedule";
import { formatJam, formatRupiah } from "@/lib/format";
import StatusBadge from "@/components/ui/StatusBadge";

// Grid slot (baris) × lapangan (kolom). Satu sel = satu slot satu lapangan.
const ScheduleGrid = ({
  date,
  fields,
  slots,
  occupancy,
  onWalkIn,
  onOpenBooking,
}) => {
  const occupiedFieldIds = new Set(occupancy.map((row) => row.field_id));
  const occupiedSlotIds = new Set(occupancy.map((row) => row.time_slot_id));
  const cells = new Map(
    occupancy.map((row) => [slotKey(row.field_id, row.time_slot_id), row]),
  );

  // Lapangan/slot nonaktif tetap tampil bila masih punya pesanan di tanggal ini.
  const visibleFields = fields.filter(
    (f) => f.is_active || occupiedFieldIds.has(f.id),
  );
  const visibleSlots = slots.filter(
    (s) => s.is_active || occupiedSlotIds.has(s.id),
  );

  if (visibleFields.length === 0 || visibleSlots.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[13px] font-semibold text-foreground">
          Belum ada lapangan atau slot jam
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          Tambahkan lapangan dan slot jam dulu lewat menu pengaturan.
        </p>
      </div>
    );
  }

  const cellButton =
    "block w-full border-b border-border px-3 py-2 align-middle text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring";

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-xs">
          <caption className="sr-only">
            Jadwal {date}, baris slot jam dan kolom lapangan
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                Jam
              </th>
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  scope="col"
                  className="border-b border-border bg-card px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {field.name}
                  {!field.is_active && (
                    <span className="ml-1 normal-case tracking-normal text-muted-foreground/70">
                      (nonaktif)
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleSlots.map((slot) => (
              <tr key={slot.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-2 text-left font-medium text-foreground tabular-nums"
                >
                  <span className="block whitespace-nowrap">
                    {formatJam(slot.start_time)}–{formatJam(slot.end_time)}
                  </span>
                  {!slot.is_active && (
                    <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                      nonaktif
                    </span>
                  )}
                </th>

                {visibleFields.map((field) => {
                  const booking = cells.get(slotKey(field.id, slot.id));

                  if (booking) {
                    return (
                      <td key={field.id} className="p-0 align-middle">
                        <button
                          type="button"
                          onClick={() => onOpenBooking(booking.booking_code)}
                          aria-label={`Buka pesanan ${booking.booking_code} atas nama ${booking.customer_name} di ${field.name}`}
                          className={`${cellButton} cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate font-medium text-foreground">
                              {booking.customer_name}
                            </span>
                            <StatusBadge status={booking.status} />
                          </span>
                        </button>
                      </td>
                    );
                  }

                  if (
                    !field.is_active ||
                    !slot.is_active ||
                    isSlotEnded(date, slot.end_time)
                  ) {
                    return (
                      <td key={field.id} className="p-0 align-middle">
                        <span
                          className={`${cellButton} bg-muted/20 text-muted-foreground`}
                        >
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Lewat atau nonaktif</span>
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={field.id} className="p-0 align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          onWalkIn(field, slot, slots.indexOf(slot))
                        }
                        aria-label={`Isi slot ${field.name} jam ${formatJam(slot.start_time)} untuk walk-in`}
                        className={`${cellButton} cursor-pointer text-muted-foreground hover:bg-primary/5 hover:text-foreground focus-visible:bg-primary/5`}
                      >
                        <span className="block tabular-nums">
                          {formatRupiah(slot.price)}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleGrid;
