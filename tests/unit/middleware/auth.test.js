import { expect } from "chai";
import jwt from "jsonwebtoken";
import sinon from "sinon";
import { config } from "../../../src/config/env.js";
import { auth } from "../../../src/middleware/auth.js";

describe("Auth Middleware", () => {
	let req, res, next;

	beforeEach(() => {
		req = { headers: {} };
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should call next() and populate req.user on valid token", () => {
		const user = { id: 1, email: "test@example.com", role: "user" };
		const token = jwt.sign(user, config.jwtSecret);
		req.headers.authorization = `Bearer ${token}`;

		auth(req, res, next);

		expect(next.calledOnce).to.be.true;
		expect(req.user).to.include(user);
	});

	it("should return 401 on expired token", () => {
		const user = { id: 1, email: "test@example.com", role: "user" };
		const token = jwt.sign(user, config.jwtSecret, { expiresIn: "-1s" });
		req.headers.authorization = `Bearer ${token}`;

		auth(req, res, next);

		expect(res.status.calledWith(401)).to.be.true;
		expect(res.json.calledWith({ error: "Unauthorized" })).to.be.true;
		expect(next.called).to.be.false;
	});

	it("should return 401 on malformed token", () => {
		req.headers.authorization = "Bearer malformed.token.here";

		auth(req, res, next);

		expect(res.status.calledWith(401)).to.be.true;
		expect(res.json.calledWith({ error: "Unauthorized" })).to.be.true;
		expect(next.called).to.be.false;
	});

	it("should return 401 on missing authorization header", () => {
		auth(req, res, next);

		expect(res.status.calledWith(401)).to.be.true;
		expect(res.json.calledWith({ error: "Unauthorized" })).to.be.true;
		expect(next.called).to.be.false;
	});

	it("should return 401 when Bearer prefix is missing", () => {
		req.headers.authorization = "token-without-bearer";

		auth(req, res, next);

		expect(res.status.calledWith(401)).to.be.true;
		expect(res.json.calledWith({ error: "Unauthorized" })).to.be.true;
		expect(next.called).to.be.false;
	});
});
