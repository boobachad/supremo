import { Router } from "express";
import * as authService from "../services/auth.service.js";

const router = Router();

/**
 * Validates an email address.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
const isValidEmail = (email) => {
	return typeof email === "string" && email.includes("@") && email.length > 3;
};

/**
 * Validates a password.
 *
 * @param {string} password - The password to validate.
 * @returns {boolean} True if the password is valid, false otherwise.
 */
const isValidPassword = (password) => {
	return typeof password === "string" && password.length >= 8;
};

/**
 * Route serving user registration.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>}
 */
router.post("/register", async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		if (!isValidEmail(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		if (!isValidPassword(password)) {
			return res
				.status(400)
				.json({ error: "Password must be at least 8 characters long" });
		}

		const user = await authService.register(email, password);
		return res.status(201).json(user);
	} catch (err) {
		next(err);
	}
});

/**
 * Route serving user login.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>}
 */
router.post("/login", async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		const token = await authService.login(email, password);
		return res.status(200).json({ token });
	} catch (err) {
		next(err);
	}
});

export default router;
