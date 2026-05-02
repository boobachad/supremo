import { expect } from "chai";
import sinon from "sinon";
import { roleGuard } from "../../../src/middleware/roleGuard.js";

describe("Role Guard Middleware", () => {
	let req, res, next;

	beforeEach(() => {
		req = { user: {} };
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should call next() if user role matches required role", () => {
		req.user.role = "admin";
		const guard = roleGuard("admin");

		guard(req, res, next);

		expect(next.calledOnce).to.be.true;
		expect(res.status.called).to.be.false;
	});

	it("should return 403 if user role does not match required role", () => {
		req.user.role = "user";
		const guard = roleGuard("admin");

		guard(req, res, next);

		expect(res.status.calledWith(403)).to.be.true;
		expect(res.json.calledWith({ error: "Forbidden" })).to.be.true;
		expect(next.called).to.be.false;
	});
});
