import db from "../../src/config/db.js";

// replacement for helpers/setup.js
// Mocha automatically injects before, beforeEach, and after into test files

beforeEach(async () => {
	await db.query("SET FOREIGN_KEY_CHECKS = 0");
	await db.query("TRUNCATE TABLE bookings");
	await db.query("TRUNCATE TABLE events");
	await db.query("TRUNCATE TABLE users");
	await db.query("SET FOREIGN_KEY_CHECKS = 1");
});

after(async () => {
	await db.end();
});
