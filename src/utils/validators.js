import { AppError } from "./errors.js";

/**
 * Validates and sanitizes an email address.
 *
 * @param {string} email - The email address to validate.
 * @returns {string} The trimmed and validated email.
 * @throws {AppError} If the email is missing, not a string, or invalid format.
 */
export const validateEmail = (email) => {
	if (typeof email !== "string") {
		throw new AppError(400, "Email must be a string");
	}
	const trimmed = email.trim();
	if (!trimmed) {
		throw new AppError(400, "Email is required");
	}
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(trimmed)) {
		throw new AppError(400, "Invalid email format");
	}
	return trimmed;
};

/**
 * Validates a password for strong complexity.
 *
 * @param {string} password - The password to validate.
 * @returns {boolean} True if the password is valid.
 * @throws {AppError} If the password does not meet complexity requirements.
 */
export const validatePassword = (password) => {
	if (typeof password !== "string") {
		throw new AppError(400, "Password must be a string");
	}
	if (password.length < 8) {
		throw new AppError(400, "Password must be at least 8 characters long");
	}
	if (password.length > 128) {
		throw new AppError(400, "Password must be at most 128 characters long");
	}
	if (!/[A-Z]/.test(password)) {
		throw new AppError(
			400,
			"Password must contain at least one uppercase letter",
		);
	}
	if (!/[a-z]/.test(password)) {
		throw new AppError(
			400,
			"Password must contain at least one lowercase letter",
		);
	}
	if (!/[0-9]/.test(password)) {
		throw new AppError(400, "Password must contain at least one number");
	}
	if (!/[^A-Za-z0-9]/.test(password)) {
		throw new AppError(
			400,
			"Password must contain at least one special character",
		);
	}
	return true;
};

/**
 * Validates that a value is a positive integer greater than 0.
 *
 * @param {any} value - The value to validate.
 * @param {string} [fieldName="Value"] - The name of the field for error messages.
 * @returns {number} The parsed positive integer.
 * @throws {AppError} If the value is not a valid positive integer.
 */
export const validatePositiveInteger = (value, fieldName = "Value") => {
	const num = Number(value);
	if (
		Number.isNaN(num) ||
		typeof value === "boolean" ||
		value === null ||
		value === "" ||
		!Number.isInteger(num)
	) {
		throw new AppError(400, `${fieldName} must be an integer`);
	}
	if (num <= 0) {
		throw new AppError(400, `${fieldName} must be greater than 0`);
	}
	return num;
};

/**
 * Validates that a date string is in the future.
 *
 * @param {string} dateString - The ISO date string to validate.
 * @returns {Date} The parsed Date object.
 * @throws {AppError} If the date is invalid or not in the future.
 */
export const validateFutureDate = (dateString) => {
	if (!dateString || typeof dateString !== "string") {
		throw new AppError(400, "Date must be a valid string");
	}
	const parsedDate = new Date(dateString);
	if (Number.isNaN(parsedDate.getTime())) {
		throw new AppError(400, "Invalid date format");
	}
	if (parsedDate.getTime() <= Date.now()) {
		throw new AppError(400, "Date must be in the future");
	}
	return parsedDate;
};

/**
 * Validates a price value.
 *
 * @param {any} value - The price value to validate.
 * @returns {number} The parsed price number.
 * @throws {AppError} If the price is invalid, negative, or has > 2 decimal places.
 */
export const validatePrice = (value) => {
	const num = Number(value);
	if (
		Number.isNaN(num) ||
		typeof value === "boolean" ||
		value === null ||
		value === ""
	) {
		throw new AppError(400, "Price must be a number");
	}

	if (Math.round(num * 100) / 100 !== num) {
		throw new AppError(400, "Price must have at most 2 decimal places");
	}

	if (num < 0) {
		throw new AppError(400, "Price must be greater than or equal to 0");
	}
	return num;
};
