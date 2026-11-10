# ERD — Website Pemesanan Online Lapangan Mini Soccer

|                 |                       |
| --------------- | --------------------- |
| Versi           | 1.0                   |
| Tanggal         | 6 November 2026       |
| Database        | PostgreSQL (Supabase) |
| Dokumen terkait | PRD.md                |

---

## 1. Ringkasan

Sistem ini memiliki **6 tabel** yang mendukung seluruh alur bisnis pada PRD:

| Tabel           | Fungsi                                                     |
| --------------- | ---------------------------------------------------------- |
| `users`         | Akun admin & staff                                         |
| `fields`        | Daftar lapangan                                            |
| `time_slots`    | Master slot jam & tarif per jam                            |
| `bookings`      | Pesanan utama                                              |
| `booking_slots` | Relasi booking ↔ slot jam (1 booking = 1–4 slot berurutan) |
| `settings`      | Konfigurasi global (rekening, QRIS, % DP, batas hari)      |

> **Tidak ada** tabel untuk: log WA, refund, riwayat status, promo, atau akun customer — sesuai PRD §3.

---

## 2. Diagram ERD

```mermaid
erDiagram
    users {
        uuid id PK
        text name
        text email UK
        text password_hash
        text role "admin | staff"
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }

    fields {
        uuid id PK
        text name
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }

    time_slots {
        uuid id PK
        time start_time
        time end_time
        int price
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }

    bookings {
        uuid id PK
        text booking_code UK "8 char acak"
        text customer_name
        text customer_phone "format 62xxx"
        uuid field_id FK
        date play_date
        time start_time "denormalized"
        int duration_hours "1-4"
        int total_price
        text payment_type "full | dp"
        int dp_percentage "null jika full"
        int amount_due "nominal dibayar sekarang"
        int remaining_amount "sisa, 0 jika full"
        text status "pending_payment | waiting_approval | PAID | completed | cancelled"
        text proof_url "Supabase Storage"
        timestamptz proof_uploaded_at
        text rejection_reason
        timestamptz deadline_at "timer 30 menit"
        text cancelled_by "customer | system | admin"
        text cancellation_reason
        uuid cancelled_by_user_id FK
        bool is_walk_in
        bool remaining_settled "DP lunas di tempat"
        timestamptz created_at
        timestamptz updated_at
    }

    booking_slots {
        uuid id PK
        uuid booking_id FK
        uuid field_id FK "denormalized utk constraint"
        uuid time_slot_id FK
        date play_date "denormalized utk constraint"
        int price "snapshot tarif saat booking"
        bool is_active "sync dari status booking"
        timestamptz created_at
    }

    settings {
        int id PK "selalu 1"
        int dp_percentage "default 50"
        int booking_window_days "default 30"
        text bank_name
        text bank_account_number
        text bank_account_holder
        text qris_image_url
        timestamptz updated_at
        uuid updated_by FK
    }

    fields ||--o{ bookings : "memiliki"
    users ||--o{ bookings : "membatalkan"
    bookings ||--|{ booking_slots : "terdiri dari"
    time_slots ||--o{ booking_slots : "dipesan pada"
    fields ||--o{ booking_slots : "slot di lapangan"
    users ||--o| settings : "memperbarui"
```
