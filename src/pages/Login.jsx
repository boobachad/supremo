import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setToken }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);
				setToken(data.token);
				navigate("/");
			} else {
				setError(data.message || "Login failed");
			}
		} catch (err) {
			console.error("Login error:", err);
			setError("Network error");
		}
	};

	return (
		<div>
			<h2>Login</h2>
			{error && (
				<p style={{ color: "red" }} data-testid="error-message">
					{error}
				</p>
			)}
			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="email">Email: </label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						data-testid="email-input"
						required
					/>
				</div>
				<div>
					<label htmlFor="password">Password: </label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						data-testid="password-input"
						required
					/>
				</div>
				<button type="submit" data-testid="login-button">
					Login
				</button>
			</form>
		</div>
	);
}
