import { expect } from "chai";
import { AppError } from "../../../src/utils/errors.js";
import {
	validateEmail,
	validateFutureDate,
	validatePassword,
	validatePositiveInteger,
	validatePrice,
} from "../../../src/utils/validators.js";

describe("Validators", () => {
	describe("validateEmail", () => {
		it("accepts a valid email", () => {
			expect(validateEmail("test@example.com")).to.equal("test@example.com");
			expect(validateEmail("  test@example.com  ")).to.equal(
				"test@example.com",
			);
		});

		it("rejects an empty email", () => {
			expect(() => validateEmail("")).to.throw(AppError, "Email is required");
			expect(() => validateEmail("   ")).to.throw(
				AppError,
				"Email is required",
			);
		});

		it("rejects missing @ or domain", () => {
			expect(() => validateEmail("testexample.com")).to.throw(
				AppError,
				"Invalid email format",
			);
			expect(() => validateEmail("test@.com")).to.throw(
				AppError,
				"Invalid email format",
			);
		});

		it("rejects invalid types", () => {
			expect(() => validateEmail(null)).to.throw(
				AppError,
				"Email must be a string",
			);
			expect(() => validateEmail(123)).to.throw(
				AppError,
				"Email must be a string",
			);
		});
	});

	describe("validatePassword", () => {
		it("accepts a strong password", () => {
			expect(validatePassword("StrongPass123!")).to.be.true;
		});

		it("rejects password shorter than 8 characters", () => {
			expect(() => validatePassword("S1!")).to.throw(
				AppError,
				"at least 8 characters",
			);
		});

		it("rejects password missing uppercase letter", () => {
			expect(() => validatePassword("weakpass123!")).to.throw(
				AppError,
				"at least one uppercase",
			);
		});

		it("rejects password missing lowercase letter", () => {
			expect(() => validatePassword("WEAKPASS123!")).to.throw(
				AppError,
				"at least one lowercase",
			);
		});

		it("rejects password missing number", () => {
			expect(() => validatePassword("WeakPassWord!")).to.throw(
				AppError,
				"at least one number",
			);
		});

		it("rejects password missing special character", () => {
			expect(() => validatePassword("WeakPass1234")).to.throw(
				AppError,
				"at least one special character",
			);
		});

		it("rejects invalid types", () => {
			expect(() => validatePassword(null)).to.throw(
				AppError,
				"Password must be a string",
			);
		});
	});

	describe("validatePositiveInteger", () => {
		it("accepts positive integers", () => {
			expect(validatePositiveInteger(1)).to.equal(1);
			expect(validatePositiveInteger("5")).to.equal(5);
		});

		it("rejects zero and negative numbers", () => {
			expect(() => validatePositiveInteger(0)).to.throw(
				AppError,
				"greater than 0",
			);
			expect(() => validatePositiveInteger(-5)).to.throw(
				AppError,
				"greater than 0",
			);
		});

		it("rejects float values", () => {
			expect(() => validatePositiveInteger(1.5)).to.throw(
				AppError,
				"must be an integer",
			);
		});

		it("rejects non-numeric values", () => {
			expect(() => validatePositiveInteger("abc")).to.throw(
				AppError,
				"must be an integer",
			);
			expect(() => validatePositiveInteger(null)).to.throw(
				AppError,
				"must be an integer",
			);
		});
	});

	describe("validateFutureDate", () => {
		it("accepts future dates", () => {
			const future = new Date(Date.now() + 100000).toISOString();
			expect(validateFutureDate(future)).to.be.a("Date");
		});

		it("rejects past dates", () => {
			const past = new Date(Date.now() - 100000).toISOString();
			expect(() => validateFutureDate(past)).to.throw(
				AppError,
				"must be in the future",
			);
		});

		it("rejects invalid date formats", () => {
			expect(() => validateFutureDate("invalid-date")).to.throw(
				AppError,
				"Invalid date format",
			);
		});

		it("rejects invalid types", () => {
			expect(() => validateFutureDate(null)).to.throw(
				AppError,
				"must be a valid string",
			);
		});
	});

	describe("validatePrice", () => {
		it("accepts positive integers, zero, and decimals up to 2 places", () => {
			expect(validatePrice(0)).to.equal(0);
			expect(validatePrice(10)).to.equal(10);
			expect(validatePrice("50")).to.equal(50);
			expect(validatePrice(10.5)).to.equal(10.5);
			expect(validatePrice(10.99)).to.equal(10.99);
		});

		it("rejects more than 2 decimal places", () => {
			expect(() => validatePrice(10.999)).to.throw(
				AppError,
				"at most 2 decimal places",
			);
		});

		it("rejects negative numbers", () => {
			expect(() => validatePrice(-1)).to.throw(
				AppError,
				"greater than or equal to 0",
			);
		});

		it("rejects invalid types", () => {
			expect(() => validatePrice("abc")).to.throw(AppError, "must be a number");
			expect(() => validatePrice(null)).to.throw(AppError, "must be a number");
			expect(() => validatePrice(true)).to.throw(AppError, "must be a number");
		});
	});
});
