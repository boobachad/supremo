import { expect } from "chai";
import sinon from "sinon";
import pool from "../../../src/config/db.js";
import {
	createEvent,
	getEventById,
	updateEvent,
} from "../../../src/services/event.service.js";
import { AppError } from "../../../src/utils/errors.js";
import { validEvent } from "../../fixtures/events.js";

describe("Event Service", () => {
	afterEach(() => {
		sinon.restore();
	});

	describe("createEvent", () => {
		it("creates an event successfully", async () => {
			const data = validEvent();
			sinon.stub(pool, "execute").resolves([{ insertId: 1 }]);

			const event = await createEvent(data, 1);
			expect(event.id).to.equal(1);
			expect(event.title).to.equal(data.title);
			expect(event.created_by).to.equal(1);
			expect(event.available_seats).to.equal(data.total_seats);
		});
	});

	describe("getEventById", () => {
		it("returns an event when found", async () => {
			const mockEvent = { id: 1, title: "Test" };
			sinon.stub(pool, "execute").resolves([[mockEvent]]);

			const event = await getEventById(1);
			expect(event.id).to.equal(1);
			expect(event.title).to.equal("Test");
		});

		it("throws 404 when event not found", async () => {
			sinon.stub(pool, "execute").resolves([[]]);

			try {
				await getEventById(999);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(404);
			}
		});
	});

	describe("getAllEvents", () => {
		it("returns a paginated list of events", async () => {
			const { getAllEvents } = await import(
				"../../../src/services/event.service.js"
			);
			const executeStub = sinon
				.stub(pool, "execute")
				.resolves([[{ total: 2 }]]);
			const queryStub = sinon
				.stub(pool, "query")
				.resolves([[{ id: 1 }, { id: 2 }]]);

			const result = await getAllEvents(1, 10);
			expect(result.total).to.equal(2);
			expect(result.events).to.have.lengthOf(2);
			expect(executeStub.calledOnce).to.be.true;
			expect(queryStub.calledOnce).to.be.true;
		});
	});

	describe("updateEvent", () => {
		it("updates an event when admin owns it", async () => {
			const mockEvent = {
				id: 1,
				created_by: 1,
				total_seats: 100,
				available_seats: 100,
			};
			const executeStub = sinon.stub(pool, "execute");
			// First call in getEventById
			executeStub.onFirstCall().resolves([[mockEvent]]);
			// Second call is UPDATE
			executeStub.onSecondCall().resolves([{}]);
			// Third call in getEventById (return updated)
			executeStub
				.onThirdCall()
				.resolves([[{ ...mockEvent, title: "New Title" }]]);

			const updated = await updateEvent(1, { title: "New Title" }, 1);
			expect(updated.title).to.equal("New Title");
		});

		it("throws 403 when admin does not own event", async () => {
			const mockEvent = { id: 1, created_by: 2 };
			sinon.stub(pool, "execute").resolves([[mockEvent]]);

			try {
				await updateEvent(1, { title: "New Title" }, 1);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(403);
			}
		});

		it("throws 400 when reducing total seats below booked seats", async () => {
			const mockEvent = {
				id: 1,
				created_by: 1,
				total_seats: 100,
				available_seats: 10,
			};
			sinon.stub(pool, "execute").resolves([[mockEvent]]);

			try {
				await updateEvent(1, { total_seats: 50 }, 1); // impossible thing
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).to.be.instanceOf(AppError);
				expect(err.statusCode).to.equal(400);
			}
		});
	});
});
