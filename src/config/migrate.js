import mysql from "mysql2/promise";
import pool from "./db.js";
import { config } from "./env.js";

async function migrate() {
	let connection;
	try {
		console.log("db migration init");

		// Create database if it doesn't exist before trying to use the pool
		connection = await mysql.createConnection({
			host: config.db.host,
			user: config.db.user,
			password: config.db.password,
			port: config.db.port,
		});
		await connection.query(
			`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``,
		);
		console.log(`database ${config.db.database} ensured.`);

		// Users table
		await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
		console.log("users table either created or exists.");

		// Events table
		await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        venue VARCHAR(255) NOT NULL,
        event_date DATETIME NOT NULL,
        total_seats INT NOT NULL,
        available_seats INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
		console.log("events table either created or exists.");

		// Bookings table
		await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
		console.log("Bookings table either created or exists.");

		console.log("db migration success!!");
	} catch (error) {
		console.error("migration failed:", error);
		process.exitCode = 1;
	} finally {
		if (connection) await connection.end();
		await pool.end();
	}
}

migrate();
