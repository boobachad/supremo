import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import eventRoutes from "./routes/event.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

// Catch all unmatched routes
app.use((_req, res, _next) => {
	res.status(404).json({ error: "Not Found" });
});

app.use(errorHandler);

export default app;
