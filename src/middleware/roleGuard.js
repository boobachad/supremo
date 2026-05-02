/**
 * Middleware to restrict access based on user roles.
 *
 * @param {string} requiredRole - The role required to access the route.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
export const roleGuard = (requiredRole) => {
	return (req, res, next) => {
		if (!req.user || req.user.role !== requiredRole) {
			return res.status(403).json({ error: "Forbidden" });
		}
		next();
	};
};
