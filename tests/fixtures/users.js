export const validUser = () => ({
	email: "test@example.com",
	password: "Password123!",
});

export const adminUser = () => ({
	email: "admin@example.com",
	password: "Admin123!",
	role: "admin",
});

export const invalidEmails = () => ["", "notanemail", "@missing.com", "a@.com"];

export const weakPasswords = () => ["", "123", "a"];
