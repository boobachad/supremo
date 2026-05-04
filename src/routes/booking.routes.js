import { Router } from "express";
import { auth } from "../middleware/auth.js";

import * as bookingService from "../services/booking.service.js";
import { validatePositiveInteger } from "../utils/validators.js";

const router = Router();

/**
 * Route serving booking creation.
 * Admin role is not allowed to create bookings based on the tests.
 */
router.post("/", auth, async (req, res, next) => {
	try {
		const { eventId, quantity } = req.body;

		if (!eventId || quantity === undefined) {
			return res
				.status(400)
				.json({ error: "eventId and quantity are required" });
		}

		validatePositiveInteger(quantity, "Quantity");

		const booking = await bookingService.createBooking(
			req.user.id,
			Number(eventId),
			Number(quantity),
		);
		return res.status(201).json(booking);
	} catch (err) {
		next(err);
	}
});

/**
 * Route serving user's bookings.
 */
router.get("/", auth, async (req, res, next) => {
	try {
		const bookings = await bookingService.getUserBookings(req.user.id);
		return res.status(200).json(bookings);
	} catch (err) {
		next(err);
	}
});

/**
 * Route serving booking cancellation.
 */
router.delete("/:id", auth, async (req, res, next) => {
	try {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "Invalid booking ID" });
		}

		const booking = await bookingService.cancelBooking(id, req.user.id);
		return res.status(200).json(booking);
	} catch (err) {
		next(err);
	}
});

export default router;
