import { pool } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

const COLUMNS = "id, name, is_active, created_at, updated_at";

export async function listActive() {
  const { rows } = await pool.query(
    `select ${COLUMNS} from fields where is_active order by name`,
  );
  return rows;
}

export async function listAll() {
  const { rows } = await pool.query(
    `select ${COLUMNS} from fields order by name`,
  );
  return rows;
}

export async function create(name) {
  const { rows } = await pool.query(
    `insert into fields (name) values ($1) returning ${COLUMNS}`,
    [name],
  );
  return rows[0];
}

export async function update(id, patch) {
  const sets = [];
  const values = [];

  if (patch.name !== undefined) {
    values.push(patch.name);
    sets.push(`name = $${values.length}`);
  }
  if (patch.is_active !== undefined) {
    values.push(patch.is_active);
    sets.push(`is_active = $${values.length}`);
  }
  if (sets.length === 0)
    throw new ApiError(422, "Minimal kirim name atau is_active");

  values.push(id);
  const { rows } = await pool.query(
    `update fields set ${sets.join(", ")} where id = $${values.length} returning ${COLUMNS}`,
    values,
  );
  if (!rows[0]) throw new ApiError(404, "Lapangan tidak ditemukan");
  return rows[0];
}

export async function remove(id) {
  let rows;
  try {
    ({ rows } = await pool.query(
      "delete from fields where id = $1 returning id",
      [id],
    ));
  } catch (err) {
    // 23503: masih direferensikan bookings/booking_slots
    if (err.code === "23503") {
      throw new ApiError(
        409,
        "Lapangan sudah memiliki pesanan; nonaktifkan saja",
      );
    }
    throw err;
  }
  if (!rows[0]) throw new ApiError(404, "Lapangan tidak ditemukan");
}
