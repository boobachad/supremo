import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyBookings({ token }) {
	const [bookings, setBookings] = useState([]);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const fetchBookings = useCallback(async () => {
		try {
			const response = await fetch("/api/bookings", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setBookings(data);
			} else {
				setError("Failed to fetch bookings");
			}
		} catch (err) {
			console.error("Fetch bookings error:", err);
			setError("Network error");
		}
	}, [token]);

	useEffect(() => {
		if (!token) {
			navigate("/login");
			return;
		}
		fetchBookings();
	}, [token, navigate, fetchBookings]);

	const handleCancel = async (id) => {
		try {
			const response = await fetch(`/api/bookings/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				// Refresh list
				fetchBookings();
			} else {
				const data = await response.json();
				setError(data.message || "Failed to cancel booking");
			}
		} catch (err) {
			console.error("Cancel booking error:", err);
			setError("Network error");
		}
	};

	return (
		<div>
			<h2>My Bookings</h2>
			{error && (
				<p style={{ color: "red" }} data-testid="error-message">
					{error}
				</p>
			)}
			<table data-testid="bookings-table">
				<thead>
					<tr>
						<th>Event Name</th>
						<th>Quantity</th>
						<th>Status</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{bookings.map((booking) => (
						<tr key={booking.id} data-testid={`booking-row-${booking.id}`}>
							<td>{booking.event_title || booking.event_id}</td>
							<td>{booking.quantity}</td>
							<td>{booking.status}</td>
							<td>
								{booking.status !== "cancelled" && (
									<button
										type="button"
										onClick={() => handleCancel(booking.id)}
										data-testid={`cancel-button-${booking.id}`}
									>
										Cancel
									</button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
