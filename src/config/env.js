import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.join(rootDir, envFile) });

export const config = {
	port: process.env.PORT || 3000,
	db: {
		host: process.env.DB_HOST || "localhost",
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "",
		database: process.env.DB_NAME || "supremo",
		port: parseInt(process.env.DB_PORT || "3306", 10),
	},
	jwtSecret: process.env.JWT_SECRET || "secretkeyhere",
};
