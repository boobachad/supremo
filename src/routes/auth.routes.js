import { Router } from "express";
import * as authService from "../services/auth.service.js";
import { validateEmail, validatePassword } from "../utils/validators.js";

const router = Router();

// Validation moved to its own specific file for better validation

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

		const validEmail = validateEmail(email);
		validatePassword(password);

		const user = await authService.register(validEmail, password);
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

		const validEmail = validateEmail(email);
		if (typeof password !== "string") {
			return res.status(400).json({ error: "Password must be a string" });
		}

		const token = await authService.login(validEmail, password);
		return res.status(200).json({ token });
	} catch (err) {
		next(err);
	}
});

export default router;
