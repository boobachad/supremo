import { expect } from "chai";
import sinon from "sinon";
import pool from "../../../src/config/db.js";
import {
	cancelBooking,
	createBooking,
} from "../../../src/services/booking.service.js";
import { AppError } from "../../../src/utils/errors.js";

describe("Booking Service", () => {
	let connectionStub;

	beforeEach(() => {
		connectionStub = {
			beginTransaction: sinon.stub().resolves(),
			commit: sinon.stub().resolves(),
			rollback: sinon.stub().resolves(),
			release: sinon.stub(),
			execute: sinon.stub(),
		};
		sinon.stub(pool, "getConnection").resolves(connectionStub);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("createBooking", () => {
		it("creates a booking successfully", async () => {
			const mockEvent = {
				id: 1,
				available_seats: 10,
				price: 50,
				event_date: new Date(Date.now() + 86400000).toISOString(),
			};

			connectionStub.execute.onCall(0).resolves([[mockEvent]]); // SELECT FOR UPDATE
			connectionStub.execute.onCall(1).resolves([{}]); // UPDATE seats
			connectionStub.execute.onCall(2).resolves([{ insertId: 1 }]); // INSERT booking

			const booking = await createBooking(1, 1, 2);

			expect(booking.id).to.equal(1);
			expect(booking.total_price).to.equal(100);
			expect(booking.status).to.equal("confirmed");
			expect(connectionStub.commit.calledOnce).to.be.true;
		});

		it("throws 400 if quantity > available seats", async () => {
			const mockEvent = {
				id: 1,
				available_seats: 1,
				price: 50,
				event_date: new Date(Date.now() + 86400000).toISOString(),
			};

			connectionStub.execute.resolves([[mockEvent]]);

			try {
				await createBooking(1, 1, 2);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(400);
				expect(connectionStub.rollback.calledOnce).to.be.true;
			}
		});

		it("throws 404 if event does not exist", async () => {
			connectionStub.execute.resolves([[]]);

			try {
				await createBooking(1, 1, 2);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(404);
			}
		});

		it("throws 400 if event is in the past", async () => {
			const mockEvent = {
				id: 1,
				available_seats: 10,
				price: 50,
				event_date: new Date(Date.now() - 86400000).toISOString(),
			};

			connectionStub.execute.resolves([[mockEvent]]);

			try {
				await createBooking(1, 1, 2);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(400);
			}
		});

		it("calculates price correctly with decimals (e.g., 49.99 * 3 = 149.97)", async () => {
			const mockEvent = {
				id: 1,
				available_seats: 10,
				price: 49.99,
				event_date: new Date(Date.now() + 86400000).toISOString(),
			};

			connectionStub.execute.onCall(0).resolves([[mockEvent]]);
			connectionStub.execute.onCall(1).resolves([{}]);
			connectionStub.execute.onCall(2).resolves([{ insertId: 1 }]);

			const booking = await createBooking(1, 1, 3);
			expect(booking.total_price).to.equal(149.97);
		});

		it("calculates price correctly with decimals (e.g., 10.10 * 7 = 70.70)", async () => {
			const mockEvent = {
				id: 1,
				available_seats: 10,
				price: 10.1,
				event_date: new Date(Date.now() + 86400000).toISOString(),
			};

			connectionStub.execute.onCall(0).resolves([[mockEvent]]);
			connectionStub.execute.onCall(1).resolves([{}]);
			connectionStub.execute.onCall(2).resolves([{ insertId: 1 }]);

			const booking = await createBooking(1, 1, 7);
			expect(booking.total_price).to.equal(70.7);
		});
	});

	describe("cancelBooking", () => {
		it("cancels booking successfully", async () => {
			const mockBooking = {
				id: 1,
				user_id: 1,
				event_id: 1,
				quantity: 2,
				status: "confirmed",
			};

			connectionStub.execute.onCall(0).resolves([[mockBooking]]); // SELECT FOR UPDATE
			connectionStub.execute.onCall(1).resolves([{}]); // UPDATE status
			connectionStub.execute.onCall(2).resolves([{}]); // UPDATE seats

			const result = await cancelBooking(1, 1);
			expect(result.status).to.equal("cancelled");
			expect(connectionStub.commit.calledOnce).to.be.true;
		});

		it("throws 403 if user does not own booking", async () => {
			const mockBooking = {
				id: 1,
				user_id: 2, // Different user
				event_id: 1,
				quantity: 2,
				status: "confirmed",
			};

			connectionStub.execute.resolves([[mockBooking]]);

			try {
				await cancelBooking(1, 1);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(403);
			}
		});

		it("throws 400 if booking is already cancelled", async () => {
			const mockBooking = {
				id: 1,
				user_id: 1,
				event_id: 1,
				quantity: 2,
				status: "cancelled", // Already cancelled
			};

			connectionStub.execute.resolves([[mockBooking]]);

			try {
				await cancelBooking(1, 1);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(400);
			}
		});

		it("throws 404 if booking not found", async () => {
			connectionStub.execute.resolves([[]]);

			try {
				await cancelBooking(1, 1);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(404);
			}
		});
	});

	describe("getUserBookings", () => {
		it("returns bookings for a given user", async () => {
			const { getUserBookings } = await import(
				"../../../src/services/booking.service.js"
			);
			const executeStub = sinon.stub(pool, "execute").resolves([
				[
					{ id: 1, user_id: 1 },
					{ id: 2, user_id: 1 },
				],
			]);

			const bookings = await getUserBookings(1);
			expect(bookings).to.be.an("array").that.has.lengthOf(2);
			expect(executeStub.calledOnce).to.be.true;
		});
	});
});
