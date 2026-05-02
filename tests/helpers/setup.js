import { execSync } from "node:child_process";
import db from "../../src/config/db.js";

export const mochaHooks = {
	async beforeAll() {
		this.timeout(10000);
		execSync("npm run db:migrate:test", { stdio: "inherit" });
	},
	async beforeEach() {
		await db.query("SET FOREIGN_KEY_CHECKS = 0");
		await db.query("TRUNCATE TABLE bookings");
		await db.query("TRUNCATE TABLE events");
		await db.query("TRUNCATE TABLE users");
		await db.query("SET FOREIGN_KEY_CHECKS = 1");
	},
	async afterAll() {
		await db.end();
	},
};
