import jwt from "jsonwebtoken";
import request from "supertest";
import { config } from "../../src/config/env.js";

export const generateToken = (user) => {
	return jwt.sign(
		{ id: user.id, email: user.email, role: user.role },
		config.jwtSecret,
		{ expiresIn: "1d" },
	);
};

export const registerAndLogin = async (app, userData) => {
	await request(app).post("/api/auth/register").send(userData);
	const res = await request(app).post("/api/auth/login").send({
		email: userData.email,
		password: userData.password,
	});
	return res.body.token;
};
