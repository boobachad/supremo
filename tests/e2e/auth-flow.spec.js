import { expect, test } from "@playwright/test";
import db from "../../src/config/db.js";
import { LoginPage } from "./pages/LoginPage.js";
import { MyBookingsPage } from "./pages/MyBookingsPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";

test.describe("Auth Flow", () => {
	test.beforeEach(async () => {
		await db.query("SET FOREIGN_KEY_CHECKS = 0");
		await db.query("TRUNCATE TABLE bookings");
		await db.query("TRUNCATE TABLE events");
		await db.query("TRUNCATE TABLE users");
		await db.query("SET FOREIGN_KEY_CHECKS = 1");
	});

	test("Register with valid data lands on events page", async ({ page }) => {
		const registerPage = new RegisterPage(page);
		await registerPage.goto();
		const uniqueEmail = `test${Date.now()}@example.com`;
		await registerPage.register(uniqueEmail, "Password123!");

		await expect(page).toHaveURL(/.*\/login/);
	});

	test("Register with existing email shows error message", async ({ page }) => {
		const registerPage = new RegisterPage(page);
		await registerPage.goto();

		// First registration
		const email = "duplicate@example.com";
		await registerPage.register(email, "Password123!");

		// Go back and try again
		await registerPage.goto();
		await registerPage.register(email, "Password123!");

		await expect(registerPage.errorMessage).toBeVisible();
	});

	test("Login with valid credentials lands on events page", async ({
		page,
	}) => {
		// Seed user
		const email = "login@example.com";
		const registerPage = new RegisterPage(page);
		await registerPage.goto();
		await registerPage.register(email, "Password123!");
		await page.waitForURL("**/login");

		const loginPage = new LoginPage(page);
		await loginPage.login(email, "Password123!");

		await expect(page).toHaveURL(/.*(\/events|\/)$/);
	});

	test("Login with wrong password shows error message and stays on login page", async ({
		page,
	}) => {
		const email = "wrongpass@example.com";
		const registerPage = new RegisterPage(page);
		await registerPage.goto();
		await registerPage.register(email, "Password123!");
		await page.waitForURL("**/login");

		const loginPage = new LoginPage(page);
		await loginPage.login(email, "WrongPass!");

		await expect(loginPage.errorMessage).toBeVisible();
		await expect(page).toHaveURL(/.*\/login/);
	});

	test("Navigate to /my-bookings without login redirects to /login", async ({
		page,
	}) => {
		const myBookingsPage = new MyBookingsPage(page);
		await myBookingsPage.goto();

		// The UI must redirect to login
		await expect(page).toHaveURL(/.*\/login/);
	});
});
