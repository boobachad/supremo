import { expect } from "chai";
import request from "supertest";
import app from "../../src/app.js";
import db from "../../src/config/db.js";
import { validEvent } from "../fixtures/events.js";
import { generateToken } from "../helpers/auth.helper.js";
import { getRowById, seedAdmin, seedUser } from "../helpers/db.helper.js";

describe("Bookings API Integration", () => {
	let adminToken;
	let userToken;
	let otherUserToken;
	let eventId;
	let eventPrice;
	let userObj;

	beforeEach(async () => {
		const admin = await seedAdmin();
		userObj = await seedUser({ email: "user1@example.com" });
		const otherUser = await seedUser({ email: "user2@example.com" });

		adminToken = generateToken(admin);
		userToken = generateToken(userObj);
		otherUserToken = generateToken(otherUser);

		// Create an event
		const eventRes = await request(app)
			.post("/api/events")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(validEvent());
		eventId = eventRes.body.id;
		eventPrice = eventRes.body.price;
	});

	describe("POST /api/bookings", () => {
		it("should return 201 for valid booking and decrement available_seats", async () => {
			const quantity = 2;
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity });

			expect(res.status).to.equal(201);
			expect(res.body).to.have.property("id");
			expect(res.body.quantity).to.equal(quantity);

			const expectedTotal = Number((quantity * eventPrice).toFixed(2));
			expect(res.body.total_price).to.equal(expectedTotal);

			// DB assertion: available_seats decreased
			const dbEvent = await getRowById("events", eventId);
			expect(dbEvent.available_seats).to.equal(dbEvent.total_seats - quantity);

			// DB assertion: booking row exists
			const dbBooking = await getRowById("bookings", res.body.id);
			expect(dbBooking).to.not.be.undefined;
			expect(Number(dbBooking.total_price)).to.equal(expectedTotal);
		});

		it("should return 401 without auth", async () => {
			const res = await request(app)
				.post("/api/bookings")
				.send({ eventId, quantity: 2 });
			expect(res.status).to.equal(401);
		});

		it("should return 404 for non-existent event", async () => {
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId: 999999, quantity: 2 });
			expect(res.status).to.equal(404);
		});

		it("should return 400 if quantity > available seats", async () => {
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity: 9999 });
			expect(res.status).to.equal(400);

			// DB assertion: seats unchanged
			const dbEvent = await getRowById("events", eventId);
			expect(dbEvent.available_seats).to.equal(dbEvent.total_seats);
		});

		it("should return 400 for malformed body", async () => {
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({});
			expect(res.status).to.equal(400);
		});

		it("should return 400 for string quantity", async () => {
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity: "two" });
			expect(res.status).to.equal(400);
		});

		it("should return 400 for 0 quantity", async () => {
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity: 0 });
			expect(res.status).to.equal(400);
		});

		it("boundary - exact capacity: should return 201 and available_seats becomes 0", async () => {
			const dbEventBefore = await getRowById("events", eventId);
			const quantity = dbEventBefore.available_seats;

			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity });

			expect(res.status).to.equal(201);

			const dbEventAfter = await getRowById("events", eventId);
			expect(dbEventAfter.available_seats).to.equal(0);
		});

		it("boundary - past event: should return 400 when booking an event in the past", async () => {
			// update event to past
			await db.execute("UPDATE events SET event_date = ? WHERE id = ?", [
				new Date(Date.now() - 86400000),
				eventId,
			]);

			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity: 1 });

			expect(res.status).to.equal(400);
		});
	});

	describe("GET /api/bookings", () => {
		beforeEach(async () => {
			// User 1's booking
			await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity: 1 });

			// User 2's booking
			await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${otherUserToken}`)
				.send({ eventId, quantity: 2 });
		});

		it("user isolation: should return only the user's bookings", async () => {
			const res = await request(app)
				.get("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).to.equal(200);
			expect(res.body).to.be.an("array").that.has.lengthOf(1);
			expect(res.body[0].user_id).to.equal(userObj.id);
			expect(res.body[0].quantity).to.equal(1);
		});

		it("should return 401 without auth", async () => {
			const res = await request(app).get("/api/bookings");
			expect(res.status).to.equal(401);
		});
	});

	describe("DELETE /api/bookings/:id", () => {
		let bookingId;
		let initialAvailableSeats;

		beforeEach(async () => {
			const res = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${userToken}`)
				.send({ eventId, quantity: 2 });
			bookingId = res.body.id;

			const dbEvent = await getRowById("events", eventId);
			initialAvailableSeats = dbEvent.available_seats;
		});

		it("should cancel booking successfully and restore seats", async () => {
			const res = await request(app)
				.delete(`/api/bookings/${bookingId}`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).to.equal(200);
			expect(res.body.status).to.equal("cancelled");

			// DB assertion: seats restored
			const dbEvent = await getRowById("events", eventId);
			expect(dbEvent.available_seats).to.equal(initialAvailableSeats + 2);
		});

		it("cancel then re-book: restores seats are actually bookable by someone else", async () => {
			// make the event completely sold out by having user A book all remaining seats
			const dbEventStart = await getRowById("events", eventId);
			if (dbEventStart.available_seats > 0) {
				await request(app)
					.post("/api/bookings")
					.set("Authorization", `Bearer ${userToken}`)
					.send({ eventId, quantity: dbEventStart.available_seats });
			}

			// user B tries to book a seat but fails because it's sold out
			const failRes = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${otherUserToken}`)
				.send({ eventId, quantity: 1 });
			expect(failRes.status).to.equal(400);

			// user A cancels their original booking of 2 seats
			await request(app)
				.delete(`/api/bookings/${bookingId}`)
				.set("Authorization", `Bearer ${userToken}`);

			// user B tries again and successfully books the restored seat
			const successRes = await request(app)
				.post("/api/bookings")
				.set("Authorization", `Bearer ${otherUserToken}`)
				.send({ eventId, quantity: 1 });
			expect(successRes.status).to.equal(201);
		});

		it("should return 403 when cancelling another user's booking", async () => {
			const res = await request(app)
				.delete(`/api/bookings/${bookingId}`)
				.set("Authorization", `Bearer ${otherUserToken}`);

			expect(res.status).to.equal(403);
		});

		it("should return 400 when cancelling an already cancelled booking", async () => {
			await request(app)
				.delete(`/api/bookings/${bookingId}`)
				.set("Authorization", `Bearer ${userToken}`);

			const res = await request(app)
				.delete(`/api/bookings/${bookingId}`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).to.equal(400);
		});

		it("should return 404 for non-existent booking", async () => {
			const res = await request(app)
				.delete("/api/bookings/999999")
				.set("Authorization", `Bearer ${userToken}`);

			expect(res.status).to.equal(404);
		});
	});
});
