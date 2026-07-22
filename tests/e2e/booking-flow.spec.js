import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import db from "../../src/config/db.js";
import { EventDetailPage } from "./pages/EventDetailPage.js";
import { EventsPage } from "./pages/EventsPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { MyBookingsPage } from "./pages/MyBookingsPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";

test.describe("Booking Flow", () => {
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

		// Seed event
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
				100,
				100,
				50.0,
				adminResult.insertId,
			],
		);
		eventId = eventResult.insertId;
	});

	test("Full happy-path booking journey", async ({ page }) => {
		const registerPage = new RegisterPage(page);
		const loginPage = new LoginPage(page);
		const eventsPage = new EventsPage(page);
		const eventDetailPage = new EventDetailPage(page);
		const myBookingsPage = new MyBookingsPage(page);

		// Register a new user
		const email = "booker@example.com";
		await registerPage.goto();
		await registerPage.register(email, "Password123!");
		await page.waitForURL("**/login");

		// Login
		await loginPage.login(email, "Password123!");
		await page.waitForURL("**/");

		// Browse events list -> at least 1 event visible
		await eventsPage.goto();
		const eventRow = eventsPage.getEventRow(eventId);
		await expect(eventRow).toBeVisible();

		// Click into an event -> see available seats count
		await eventsPage.viewEvent(eventId);
		await expect(page).toHaveURL(new RegExp(`/events/${eventId}`));
		await expect(page.locator("text=Available Seats: 100")).toBeVisible();

		// Enter quantity 2 -> click Book
		await eventDetailPage.bookTickets(2);

		// Success feedback shown
		await expect(eventDetailPage.successMessage).toBeVisible();

		// Navigate to My Bookings -> booking appears with correct event name
		await myBookingsPage.goto();
		const bookingsTableText = await myBookingsPage.bookingsTable.textContent();
		expect(bookingsTableText).toContain("Test E2E Event");

		// Click Cancel on the booking
		const cancelButton = page
			.locator('[data-testid^="cancel-button-"]')
			.first();
		await expect(cancelButton).toBeVisible();
		await cancelButton.click();

		// Booking shows "cancelled"
		await page.waitForTimeout(1000); // Wait for API response and re-render
		const updatedText = await myBookingsPage.bookingsTable.textContent();
		const isCancelledOrGone =
			updatedText.includes("cancelled") ||
			!updatedText.includes("Test E2E Event");
		expect(isCancelledOrGone).toBeTruthy();

		// Go back to event detail -> available seats increased by 2
		await eventDetailPage.goto(eventId);
		await expect(page.locator("text=Available Seats: 100")).toBeVisible();
	});
});
