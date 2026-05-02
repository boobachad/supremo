import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { config } from "../config/env.js";
import { AppError } from "../utils/errors.js";

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {string} role
 * @property {Date} created_at
 */

/**
 * Registers a new user.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<User>} The registered user.
 * @throws {AppError} If the email is already in use.
 */
export const register = async (email, password) => {
	// Check if user exists
	const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
		email,
	]);
	if (existing.length > 0) {
		throw new AppError(409, "Email already in use");
	}

	// Hash password
	const salt = await bcrypt.genSalt(10);
	const passwordHash = await bcrypt.hash(password, salt);

	// Insert user
	const [result] = await db.query(
		"INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
		[email, passwordHash, "user"],
	);

	const [user] = await db.query(
		"SELECT id, email, role, created_at FROM users WHERE id = ?",
		[result.insertId],
	);

	return user[0];
};

/**
 * Logs in a user.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} The JWT token.
 * @throws {AppError} If the credentials are invalid.
 */
export const login = async (email, password) => {
	const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
		email,
	]);
	const user = users[0];

	if (!user) {
		throw new AppError(401, "Invalid credentials");
	}

	const isMatch = await bcrypt.compare(password, user.password_hash);
	if (!isMatch) {
		throw new AppError(401, "Invalid credentials");
	}

	const token = jwt.sign(
		{ id: user.id, email: user.email, role: user.role },
		config.jwtSecret,
		{ expiresIn: "1d" },
	);

	return token;
};
