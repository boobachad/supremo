import pool from "../config/db.js";
import { AppError } from "../utils/errors.js";

/**
 * Creates a new booking.
 *
 * @param {number} userId - The ID of the user.
 * @param {number} eventId - The ID of the event.
 * @param {number} quantity - Number of tickets to book.
 * @returns {Promise<Object>} The created booking object.
 * @throws {AppError} If validation fails or capacity is exceeded.
 */
export const createBooking = async (userId, eventId, quantity) => {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();

		const [events] = await connection.execute(
			"SELECT available_seats, price, event_date FROM events WHERE id = ? FOR UPDATE",
			[eventId],
		);

		if (!events.length) {
			throw new AppError(404, "Event not found");
		}

		const event = events[0];

		if (new Date(event.event_date) <= new Date()) {
			throw new AppError(400, "Cannot book tickets for a past event");
		}

		if (event.available_seats < quantity) {
			throw new AppError(400, "Not enough available seats");
		}

		const totalPrice = Number((quantity * Number(event.price)).toFixed(2));

		await connection.execute(
			"UPDATE events SET available_seats = available_seats - ? WHERE id = ?",
			[quantity, eventId],
		);

		const [result] = await connection.execute(
			"INSERT INTO bookings (user_id, event_id, quantity, total_price) VALUES (?, ?, ?, ?)",
			[userId, eventId, quantity, totalPrice],
		);

		await connection.commit();

		return {
			id: result.insertId,
			user_id: userId,
			event_id: eventId,
			quantity,
			total_price: totalPrice,
			status: "confirmed",
		};
	} catch (err) {
		await connection.rollback();
		throw err;
	} finally {
		connection.release();
	}
};

/**
 * Gets all bookings for a user.
 *
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array>} List of bookings.
 */
export const getUserBookings = async (userId) => {
	const [rows] = await pool.execute(
		`SELECT b.*, e.title as event_title, e.event_date 
		 FROM bookings b 
		 JOIN events e ON b.event_id = e.id 
		 WHERE b.user_id = ? 
		 ORDER BY b.created_at DESC`,
		[userId],
	);
	return rows;
};

/**
 * Cancels a booking.
 *
 * @param {number} bookingId - The ID of the booking to cancel.
 * @param {number} userId - The ID of the user requesting cancellation.
 * @returns {Promise<Object>} The updated booking object.
 * @throws {AppError} If booking not found or unauthorized.
 */
export const cancelBooking = async (bookingId, userId) => {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();

		const [bookings] = await connection.execute(
			"SELECT * FROM bookings WHERE id = ? FOR UPDATE",
			[bookingId],
		);

		if (!bookings.length) {
			throw new AppError(404, "Booking not found");
		}

		const booking = bookings[0];

		if (booking.user_id !== userId) {
			throw new AppError(403, "You can only cancel your own bookings");
		}

		if (booking.status === "cancelled") {
			throw new AppError(400, "Booking is already cancelled");
		}

		await connection.execute(
			"UPDATE bookings SET status = 'cancelled' WHERE id = ?",
			[bookingId],
		);

		await connection.execute(
			"UPDATE events SET available_seats = available_seats + ? WHERE id = ?",
			[booking.quantity, booking.event_id],
		);

		await connection.commit();

		return { ...booking, status: "cancelled" };
	} catch (err) {
		await connection.rollback();
		throw err;
	} finally {
		connection.release();
	}
};
