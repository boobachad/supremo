import { expect } from "chai";
import request from "supertest";
import app from "../../src/app.js";
import { pastEvent, validEvent } from "../fixtures/events.js";
import { generateToken } from "../helpers/auth.helper.js";
import { getRowById, seedAdmin, seedUser } from "../helpers/db.helper.js";

describe("Events API Integration", () => {
	let adminToken;
	let userToken;

	beforeEach(async () => {
		const admin = await seedAdmin();
		const user = await seedUser({ email: "user2@example.com" });
		adminToken = generateToken(admin);
		userToken = generateToken(user);
	});

	describe("POST /api/events", () => {
		it("should create an event as admin and return 201", async () => {
			const event = validEvent();
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(event);

			expect(res.status).to.equal(201);
			expect(res.body).to.have.property("id");
			expect(res.body.title).to.equal(event.title);

			const dbEvent = await getRowById("events", res.body.id);
			expect(dbEvent).to.not.be.undefined;
			expect(dbEvent.title).to.equal(event.title);
		});

		it("should return 403 when creating an event as user", async () => {
			const event = validEvent();
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${userToken}`)
				.send(event);

			expect(res.status).to.equal(403);
		});

		it("should return 401 without auth", async () => {
			const res = await request(app).post("/api/events").send(validEvent());
			expect(res.status).to.equal(401);
		});

		it("should return 400 for past date", async () => {
			const event = pastEvent();
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(event);

			expect(res.status).to.equal(400);
		});

		it("should return 400 for malformed body", async () => {
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({});
			expect(res.status).to.equal(400);
		});

		it("should return 400 for negative price", async () => {
			const event = { ...validEvent(), price: -10 };
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(event);

			expect(res.status).to.equal(400);
		});
	});

	describe("GET /api/events", () => {
		beforeEach(async () => {
			await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(validEvent());
			await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ ...validEvent(), title: "Event 2" });
			await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ ...validEvent(), title: "Event 3" });
		});

		it("should return 200 and a list of events", async () => {
			const res = await request(app).get("/api/events");
			expect(res.status).to.equal(200);
			expect(res.body.events).to.be.an("array");
			expect(res.body.events.length).to.be.at.least(3);
			expect(res.body).to.have.property("total");
		});

		it("should return exactly 2 items for page=1&limit=2", async () => {
			const res = await request(app).get("/api/events?page=1&limit=2");
			expect(res.status).to.equal(200);
			expect(res.body.events).to.have.lengthOf(2);
			expect(res.body.total).to.be.at.least(3);
		});

		it("should normalize page 0 to page 1 (or return valid response)", async () => {
			const res = await request(app).get("/api/events?page=0");
			expect(res.status).to.be.oneOf([200, 400]);
			if (res.status === 200) {
				expect(res.body.events).to.be.an("array");
			}
		});

		it("should return empty array for page=9999", async () => {
			const res = await request(app).get("/api/events?page=9999");
			expect(res.status).to.equal(200);
			expect(res.body.events).to.be.an("array").that.is.empty;
		});
	});

	describe("GET /api/events/:id", () => {
		let eventId;

		beforeEach(async () => {
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(validEvent());
			eventId = res.body.id;
		});

		it("should return 200 and event object for valid ID", async () => {
			const res = await request(app).get(`/api/events/${eventId}`);
			expect(res.status).to.equal(200);
			expect(res.body.id).to.equal(eventId);
		});

		it("should return 404 for non-existent ID", async () => {
			const res = await request(app).get("/api/events/999999");
			expect(res.status).to.equal(404);
		});
	});

	describe("PUT /api/events/:id", () => {
		let eventId;
		let otherAdminToken;

		beforeEach(async () => {
			const res = await request(app)
				.post("/api/events")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(validEvent());
			eventId = res.body.id;

			const otherAdmin = await seedAdmin({ email: "admin2@example.com" });
			otherAdminToken = generateToken(otherAdmin);
		});

		it("should update event as the admin who created it", async () => {
			const res = await request(app)
				.put(`/api/events/${eventId}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ title: "Updated Title" });

			expect(res.status).to.equal(200);
			expect(res.body.title).to.equal("Updated Title");
		});

		it("should return 403 when updating an event created by another admin", async () => {
			const res = await request(app)
				.put(`/api/events/${eventId}`)
				.set("Authorization", `Bearer ${otherAdminToken}`)
				.send({ title: "Updated Title" });

			expect(res.status).to.equal(403);
		});
	});
});
