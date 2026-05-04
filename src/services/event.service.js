import pool from "../config/db.js";
import { AppError } from "../utils/errors.js";

/**
 * Creates a new event.
 *
 * @param {Object} data - Event data.
 * @param {string} data.title
 * @param {string} data.description
 * @param {string} data.venue
 * @param {string|Date} data.event_date
 * @param {number} data.total_seats
 * @param {number} data.price
 * @param {number} adminId - The ID of the admin creating the event.
 * @returns {Promise<Object>} The created event object.
 */
export const createEvent = async (data, adminId) => {
	const { title, description, venue, event_date, total_seats, price } = data;

	const formattedDate = new Date(event_date);

	const [result] = await pool.execute(
		`INSERT INTO events (title, description, venue, event_date, total_seats, available_seats, price, created_by)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			title,
			description || null,
			venue,
			formattedDate,
			total_seats,
			total_seats,
			price,
			adminId,
		],
	);

	return {
		id: result.insertId,
		title,
		description: description || null,
		venue,
		event_date: formattedDate,
		total_seats,
		available_seats: total_seats,
		price,
		created_by: adminId,
	};
};

/**
 * Gets all events with pagination.
 *
 * @param {number} page - Page number.
 * @param {number} limit - Items per page.
 * @returns {Promise<{events: Array, total: number}>} List of events and total count.
 */
export const getAllEvents = async (page = 1, limit = 10) => {
	const offset = (page - 1) * limit;

	const [[{ total }]] = await pool.execute(
		"SELECT COUNT(*) as total FROM events",
	);

	// Use query for limits to avoid prepared statement issues with numbers in some cases,
	// though pool.execute handles numbers just fine, pool.query is robust for LIMIT.
	const [events] = await pool.query(
		"SELECT * FROM events ORDER BY event_date ASC LIMIT ? OFFSET ?",
		[Number(limit), Number(offset)],
	);

	return { events, total: Number(total) };
};

/**
 * Gets a single event by ID.
 *
 * @param {number} id - Event ID.
 * @returns {Promise<Object>} Event object.
 * @throws {AppError} If event not found.
 */
export const getEventById = async (id) => {
	const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [id]);
	if (!rows.length) {
		throw new AppError(404, "Event not found");
	}
	return rows[0];
};

/**
 * Updates an event.
 *
 * @param {number} id - Event ID.
 * @param {Object} data - Update data.
 * @param {number} adminId - Admin ID requesting update.
 * @returns {Promise<Object>} Updated event.
 * @throws {AppError} If event not found or admin not authorized.
 */
export const updateEvent = async (id, data, adminId) => {
	const event = await getEventById(id);

	if (event.created_by !== adminId) {
		throw new AppError(403, "You can only update events you created");
	}

	const title = data.title !== undefined ? data.title : event.title;
	const description =
		data.description !== undefined ? data.description : event.description;
	const venue = data.venue !== undefined ? data.venue : event.venue;
	const event_date =
		data.event_date !== undefined
			? new Date(data.event_date)
			: event.event_date;
	const total_seats =
		data.total_seats !== undefined ? data.total_seats : event.total_seats;
	const price = data.price !== undefined ? data.price : event.price;

	const seatsDiff = total_seats - event.total_seats;
	const newAvailableSeats = event.available_seats + seatsDiff;

	if (newAvailableSeats < 0) {
		throw new AppError(
			400,
			"Cannot reduce total seats below currently booked seats",
		);
	}

	await pool.execute(
		`UPDATE events 
		 SET title = ?, description = ?, venue = ?, event_date = ?, total_seats = ?, available_seats = ?, price = ?
		 WHERE id = ?`,
		[
			title,
			description,
			venue,
			event_date,
			total_seats,
			newAvailableSeats,
			price,
			id,
		],
	);

	return await getEventById(id);
};
