import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EventDetail({ token }) {
	const { id } = useParams();
	const navigate = useNavigate();
	const [event, setEvent] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				const response = await fetch(`/api/events/${id}`);
				if (response.ok) {
					const data = await response.json();
					setEvent(data);
				} else {
					setError("Failed to fetch event details");
				}
			} catch (err) {
				console.error("Fetch event error:", err);
				setError("Network error");
			}
		};

		fetchEvent();
	}, [id]);

	const handleBook = async (e) => {
		e.preventDefault();
		if (!token) {
			navigate("/login");
			return;
		}

		try {
			const response = await fetch("/api/bookings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ eventId: parseInt(id, 10), quantity }),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess("Booking successful!");
				setError("");
			} else {
				setError(data.message || "Booking failed");
				setSuccess("");
			}
		} catch (err) {
			console.error("Booking error:", err);
			setError("Network error");
			setSuccess("");
		}
	};

	if (!event) return <div>Loading...</div>;

	return (
		<div>
			<h2>{event.title}</h2>
			{error && (
				<p style={{ color: "red" }} data-testid="error-message">
					{error}
				</p>
			)}
			{success && (
				<p style={{ color: "green" }} data-testid="success-message">
					{success}
				</p>
			)}
			<p>Date: {new Date(event.event_date).toLocaleDateString()}</p>
			<p>Available Seats: {event.available_seats}</p>

			<form onSubmit={handleBook}>
				<div>
					<label htmlFor="quantity">Quantity: </label>
					<input
						id="quantity"
						type="number"
						min="1"
						value={quantity}
						onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
						data-testid="quantity-input"
						required
					/>
				</div>
				<button type="submit" data-testid="book-button">
					Book
				</button>
			</form>
		</div>
	);
}
