import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Catch all unmatched routes
app.use((_req, res, _next) => {
	res.status(404).json({ error: "Not Found" });
});

app.use(errorHandler);

export default app;
