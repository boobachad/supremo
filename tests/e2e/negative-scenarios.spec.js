import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import db from "../../src/config/db.js";
import { EventDetailPage } from "./pages/EventDetailPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";

test.describe("Negative Scenarios", () => {
	let eventId;

	test.beforeEach(async () => {
		await db.query("SET FOREIGN_KEY_CHECKS = 0");
		await db.query("TRUNCATE TABLE bookings");
		await db.query("TRUNCATE TABLE events");
		await db.query("TRUNCATE TABLE users");
		await db.query("SET FOREIGN_KEY_CHECKS = 1");

		// Seed admin to create event
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash("Admin123!", salt);
		const [adminResult] = await db.query(
			"INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
			["admin@example.com", hash, "admin"],
		);

		// Seed event with 5 seats
		const eventDate = new Date(Date.now() + 86400000)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");
		const [eventResult] = await db.query(
			"INSERT INTO events (title, description, venue, event_date, total_seats, available_seats, price, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			[
				"Test E2E Event",
				"Description",
				"Venue",
				eventDate,
				5,
				5,
				50.0,
				adminResult.insertId,
			],
		);
		eventId = eventResult.insertId;
	});

	test("Enter quantity greater than available seats shows error message", async ({
		page,
	}) => {
		const email = "user1@example.com";
		const registerPage = new RegisterPage(page);
		await registerPage.goto();
		await registerPage.register(email, "Password123!");
		await page.waitForURL("**/login");

		const loginPage = new LoginPage(page);
		await loginPage.login(email, "Password123!");
		await page.waitForURL("**/");

		const eventDetailPage = new EventDetailPage(page);
		await eventDetailPage.goto(eventId);

		await eventDetailPage.bookTickets(10);
		await expect(eventDetailPage.errorMessage).toBeVisible();
	});

	test("Enter quantity 0 prevents submission", async ({ page }) => {
		const email = "user2@example.com";
		const registerPage = new RegisterPage(page);
		await registerPage.goto();
		await registerPage.register(email, "Password123!");
		await page.waitForURL("**/login");

		const loginPage = new LoginPage(page);
		await loginPage.login(email, "Password123!");
		await page.waitForURL("**/");

		const eventDetailPage = new EventDetailPage(page);
		await eventDetailPage.goto(eventId);

		await eventDetailPage.quantityInput.fill("0");
		await eventDetailPage.bookButton.click();

		// min="1" triggers HTML5 validation
		const validity = await eventDetailPage.quantityInput.evaluate(
			(input) => input.validity.valid,
		);
		expect(validity).toBe(false);

		await expect(eventDetailPage.successMessage).toBeHidden();
	});

	test("Try booking with expired session/token redirects to login", async ({
		page,
	}) => {
		// go directly to event detail page without auth
		const eventDetailPage = new EventDetailPage(page);
		await eventDetailPage.goto(eventId);

		// when book clicked
		await eventDetailPage.bookTickets(1);
		// should redirect to login page
		await expect(page).toHaveURL(/.*\/login/);
	});
});
