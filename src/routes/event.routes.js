import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import * as eventService from "../services/event.service.js";
import {
	validateFutureDate,
	validatePositiveInteger,
	validatePrice,
} from "../utils/validators.js";

const router = Router();

/**
 * Route serving event creation.
 */
router.post("/", auth, roleGuard("admin"), async (req, res, next) => {
	try {
		const { title, description, venue, event_date, total_seats, price } =
			req.body;

		if (
			!title ||
			!venue ||
			!event_date ||
			total_seats === undefined ||
			price === undefined
		) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		validateFutureDate(event_date);
		validatePositiveInteger(total_seats, "Total seats");
		validatePrice(price);

		const event = await eventService.createEvent(
			{
				title,
				description,
				venue,
				event_date,
				total_seats: Number(total_seats),
				price: Number(price),
			},
			req.user.id,
		);

		return res.status(201).json(event);
	} catch (err) {
		next(err);
	}
});

/**
 * Route serving paginated events list.
 */
router.get("/", async (req, res, next) => {
	try {
		const page = req.query.page ? Number(req.query.page) : 1;
		const limit = req.query.limit ? Number(req.query.limit) : 10;

		if (Number.isNaN(page) || page < 1) {
			return res.status(400).json({ error: "Invalid page number" });
		}

		if (Number.isNaN(limit) || limit < 1) {
			return res.status(400).json({ error: "Invalid limit number" });
		}

		const result = await eventService.getAllEvents(page, limit);
		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
});

/**
 * Route serving a single event by ID.
 */
router.get("/:id", async (req, res, next) => {
	try {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "Invalid event ID" });
		}

		const event = await eventService.getEventById(id);
		return res.status(200).json(event);
	} catch (err) {
		next(err);
	}
});

/**
 * Route serving event updates.
 */
router.put("/:id", auth, roleGuard("admin"), async (req, res, next) => {
	try {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "Invalid event ID" });
		}

		const { title, description, venue, event_date, total_seats, price } =
			req.body;

		if (event_date !== undefined) {
			validateFutureDate(event_date);
		}
		if (total_seats !== undefined) {
			validatePositiveInteger(total_seats, "Total seats");
		}
		if (price !== undefined) {
			validatePrice(price);
		}

		const event = await eventService.updateEvent(
			id,
			{
				title,
				description,
				venue,
				event_date,
				total_seats:
					total_seats !== undefined ? Number(total_seats) : undefined,
				price: price !== undefined ? Number(price) : undefined,
			},
			req.user.id,
		);

		return res.status(200).json(event);
	} catch (err) {
		next(err);
	}
});

export default router;
