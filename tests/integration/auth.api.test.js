import { expect } from "chai";
import request from "supertest";
import app from "../../src/app.js";
import db from "../../src/config/db.js";
import { invalidEmails, validUser, weakPasswords } from "../fixtures/users.js";

describe("Auth API Integration", () => {
	describe("POST /api/auth/register", () => {
		it("should register a valid user and return 201 without password_hash", async () => {
			const user = validUser();
			const res = await request(app).post("/api/auth/register").send(user);

			expect(res.status).to.equal(201);
			expect(res.body).to.have.property("id");
			expect(res.body).to.have.property("email", user.email);
			expect(res.body).to.not.have.property("password_hash");

			// DB assertions
			const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
				user.email,
			]);
			expect(rows).to.have.lengthOf(1);
			const dbUser = rows[0];
			expect(dbUser.password_hash).to.not.equal(user.password);
			expect(dbUser.password_hash).to.be.a("string").and.not.empty;
		});

		it("should return 409 for duplicate email", async () => {
			const user = validUser();
			// First registration
			await request(app).post("/api/auth/register").send(user);

			// Duplicate registration
			const res = await request(app).post("/api/auth/register").send(user);

			expect(res.status).to.equal(409);
			expect(res.body.error).to.equal("Email already in use");
		});

		it("should return 400 for malformed body (empty)", async () => {
			const res = await request(app).post("/api/auth/register").send({});
			expect(res.status).to.equal(400);
			expect(res.body.error).to.equal("Email and password are required");
		});

		it("should return 400 for invalid email format", async () => {
			const emails = invalidEmails();
			for (const email of emails) {
				const res = await request(app)
					.post("/api/auth/register")
					.send({ email, password: "Password123!" });
				if (email === "") {
					expect(res.status).to.equal(400);
					expect(res.body.error).to.equal("Email and password are required");
				} else {
					expect(res.status).to.equal(400);
					expect(res.body.error).to.equal("Invalid email format");
				}
			}
		});

		it("should return 400 for weak password", async () => {
			const passwords = weakPasswords();
			for (const password of passwords) {
				const res = await request(app)
					.post("/api/auth/register")
					.send({ email: "test@example.com", password });
				if (password === "") {
					expect(res.status).to.equal(400);
					expect(res.body.error).to.equal("Email and password are required");
				} else {
					expect(res.status).to.equal(400);
					expect(res.body.error).to.equal(
						"Password must be at least 8 characters long",
					);
				}
			}
		});
	});

	describe("POST /api/auth/login", () => {
		beforeEach(async () => {
			await request(app).post("/api/auth/register").send(validUser());
		});

		it("should return 200 and token for valid credentials", async () => {
			const res = await request(app).post("/api/auth/login").send(validUser());
			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("token");
			expect(res.body.token).to.be.a("string");
		});

		it("should return 401 for wrong password", async () => {
			const user = validUser();
			const res = await request(app)
				.post("/api/auth/login")
				.send({ email: user.email, password: "wrongpassword" });
			expect(res.status).to.equal(401);
			expect(res.body.error).to.equal("Invalid credentials");
		});

		it("should return 401 for non-existent email (same error)", async () => {
			const res = await request(app)
				.post("/api/auth/login")
				.send({ email: "notfound@example.com", password: "Password123!" });
			expect(res.status).to.equal(401);
			expect(res.body.error).to.equal("Invalid credentials");
		});

		it("should return 400 for malformed body", async () => {
			const res = await request(app).post("/api/auth/login").send({});
			expect(res.status).to.equal(400);
			expect(res.body.error).to.equal("Email and password are required");
		});
	});
});
