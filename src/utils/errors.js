/**
 * Application error class.
 *
 * @extends Error
 */
export class AppError extends Error {
	/**
	 * Creates an AppError instance.
	 *
	 * @param {number} statusCode - The HTTP status code.
	 * @param {string} message - The error message.
	 */
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}
