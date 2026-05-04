import { expect } from "chai";
import request from "supertest";
import app from "../../src/app.js";
import { singleSeatEvent } from "../fixtures/events.js";
import { generateToken } from "../helpers/auth.helper.js";
import {
	getRowById,
	getRowCount,
	seedAdmin,
	seedUser,
} from "../helpers/db.helper.js";

describe("Booking Concurrency", function () {
	this.timeout(15000);

	it("exactly 1 booking succeeds when 20 users race for the last seat", async () => {
		// seed admin and create event with 1 available seat
		const admin = await seedAdmin();
		const adminToken = generateToken(admin);

		const eventRes = await request(app)
			.post("/api/events")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(singleSeatEvent());

		const eventId = eventRes.body.id;

		// seed 20 different users and get their tokens
		const tokens = [];
		for (let i = 0; i < 20; i++) {
			const user = await seedUser({ email: `racer${i}@example.com` });
			tokens.push(generateToken(user));
		}

		// fire 20 simultaneous POST /api/bookings with Promise.all
		const results = await Promise.all(
			tokens.map((token) =>
				request(app)
					.post("/api/bookings")
					.set("Authorization", `Bearer ${token}`)
					.send({ eventId, quantity: 1 }),
			),
		);

		// count successes and failures
		const successes = results.filter((r) => r.status === 201);
		const failures = results.filter((r) => r.status === 400);

		// Assertions
		expect(successes).to.have.lengthOf(1);
		expect(failures).to.have.lengthOf(19);

		// DB assertion: available_seats is exactly 0, not negative
		const event = await getRowById("events", eventId);
		expect(event.available_seats).to.equal(0);

		// DB assertion: exactly 1 booking row with status 'confirmed'
		const bookingCount = await getRowCount("bookings", {
			event_id: eventId,
			status: "confirmed",
		});
		expect(bookingCount).to.equal(1);
	});
});
