import bcrypt from "bcryptjs";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import sinon from "sinon";
import db from "../../../src/config/db.js";
import { config } from "../../../src/config/env.js";
import { login, register } from "../../../src/services/auth.service.js";
import { AppError } from "../../../src/utils/errors.js";

describe("Auth Service", () => {
	afterEach(() => {
		sinon.restore();
	});

	describe("register", () => {
		it("should return user object without password_hash when input is valid", async () => {
			const dbStub = sinon.stub(db, "query");
			dbStub.onCall(0).resolves([[]]); // No existing user
			dbStub.onCall(1).resolves([{ insertId: 1 }]); // Insert result
			dbStub.onCall(2).resolves([
				[
					{
						id: 1,
						email: "test@example.com",
						role: "user",
						created_at: new Date(),
					},
				],
			]);

			const user = await register("test@example.com", "password123");

			expect(user).to.have.property("id", 1);
			expect(user).to.have.property("email", "test@example.com");
			expect(user).to.have.property("role", "user");
			expect(user).to.not.have.property("password_hash");
		});

		it("should throw AppError with 409 status on duplicate email", async () => {
			const dbStub = sinon.stub(db, "query");
			dbStub.onCall(0).resolves([[{ id: 1 }]]); // Existing user

			try {
				await register("test@example.com", "password123");
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(409);
				expect(err.message).to.equal("Email already in use");
			}
		});
	});

	describe("login", () => {
		it("should return a string token with correct credentials", async () => {
			const dbStub = sinon.stub(db, "query");
			const hash = await bcrypt.hash("password123", 10);
			dbStub.onCall(0).resolves([
				[
					{
						id: 1,
						email: "test@example.com",
						role: "user",
						password_hash: hash,
					},
				],
			]);

			const token = await login("test@example.com", "password123");
			expect(token).to.be.a("string");

			const decoded = jwt.verify(token, config.jwtSecret);
			expect(decoded.email).to.equal("test@example.com");
		});

		it("should throw AppError with 401 on wrong password", async () => {
			const dbStub = sinon.stub(db, "query");
			const hash = await bcrypt.hash("password123", 10);
			dbStub.onCall(0).resolves([
				[
					{
						id: 1,
						email: "test@example.com",
						role: "user",
						password_hash: hash,
					},
				],
			]);

			try {
				await login("test@example.com", "wrongpassword");
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(401);
				expect(err.message).to.equal("Invalid credentials");
			}
		});

		it("should throw AppError with 401 on non-existent email", async () => {
			const dbStub = sinon.stub(db, "query");
			dbStub.onCall(0).resolves([[]]);

			try {
				await login("notfound@example.com", "password123");
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(401);
				expect(err.message).to.equal("Invalid credentials");
			}
		});

		it("should verify wrong-email and wrong-password return identical error message", async () => {
			const dbStub = sinon.stub(db, "query");
			const hash = await bcrypt.hash("password123", 10);

			dbStub
				.withArgs(sinon.match(/SELECT \* FROM users/, "notfound@example.com"))
				.resolves([[]]);
			dbStub
				.withArgs(sinon.match(/SELECT \* FROM users/, "test@example.com"))
				.resolves([
					[
						{
							id: 1,
							email: "test@example.com",
							role: "user",
							password_hash: hash,
						},
					],
				]);

			let emailErr, passErr;
			try {
				await login("notfound@example.com", "password");
			} catch (e) {
				emailErr = e;
			}
			try {
				await login("test@example.com", "wrongpassword");
			} catch (e) {
				passErr = e;
			}

			expect(emailErr.message).to.equal(passErr.message);
		});
	});
});
