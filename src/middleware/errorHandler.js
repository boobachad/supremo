import { AppError } from "../utils/errors.js";

/**
 * Global error handling middleware.
 *
 * @param {Error | AppError} err - The error object.
 * @param {import('express').Request} _req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} _next - The next middleware function.
 * @returns {import('express').Response} The JSON response containing the error message.
 */
export const errorHandler = (err, _req, res, _next) => {
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			error: err.message,
		});
	}

	console.error("Unhandled Error:", err);
	return res.status(500).json({
		error: "Internal Server Error",
	});
};
