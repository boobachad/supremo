import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Middleware to authenticate requests using JWT.
 *
 * @param {import('express').Request & { user?: any }} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 * @returns {import('express').Response | void} Returns a 401 response if unauthorized, otherwise calls next().
 */
export const auth = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, config.jwtSecret);
		req.user = decoded;
		next();
	} catch (_err) {
		return res.status(401).json({ error: "Unauthorized" });
	}
};
