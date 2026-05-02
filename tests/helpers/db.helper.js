import bcrypt from "bcryptjs";
import db from "../../src/config/db.js";

export const seedUser = async (overrides = {}) => {
	const email = overrides.email || "user@example.com";
	const password = overrides.password || "Password123!";
	const role = overrides.role || "user";

	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hash(password, salt);

	const [result] = await db.query(
		"INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
		[email, hash, role],
	);

	const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
		result.insertId,
	]);
	return rows[0];
};

export const seedAdmin = async (overrides = {}) => {
	return seedUser({
		...overrides,
		role: "admin",
		email: overrides.email || "admin@example.com",
	});
};

export const getRowById = async (table, id) => {
	const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
	return rows[0];
};

export const getRowCount = async (table, where) => {
	let query = `SELECT COUNT(*) as count FROM ${table}`;
	const values = [];

	if (where) {
		const keys = Object.keys(where);
		if (keys.length > 0) {
			const conditions = keys.map((k) => `${k} = ?`).join(" AND ");
			query += ` WHERE ${conditions}`;
			values.push(...Object.values(where));
		}
	}

	const [rows] = await db.query(query, values);
	return rows[0].count;
};
