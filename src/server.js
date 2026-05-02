import app from "./app.js";
import { config } from "./config/env.js";

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

export default server;
