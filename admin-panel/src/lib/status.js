// Label status dipakai badge & filter halaman Pesanan (PRD §9.3).
export const STATUS_LABELS = {
  pending_payment: "Menunggu bayar",
  waiting_approval: "Perlu verifikasi",
  PAID: "Lunas",
  completed: "Selesai",
  cancelled: "Batal",
};

export const STATUS_VALUES = Object.keys(STATUS_LABELS);

// Nilai sentinel "tanpa filter status" untuk dropdown; API menerima status kosong.
export const ALL_STATUS = "all";

export const STATUS_ITEMS = [
  { value: ALL_STATUS, label: "Semua status" },
  ...STATUS_VALUES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];
