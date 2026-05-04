import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Events() {
	const [events, setEvents] = useState([]);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const response = await fetch("/api/events");
				if (response.ok) {
					const data = await response.json();
					setEvents(data.events || []);
				} else {
					setError("Failed to fetch events");
				}
			} catch (err) {
				console.error("Fetch events error:", err);
				setError("Network error");
			}
		};

		fetchEvents();
	}, []);

	return (
		<div>
			<h2>Events</h2>
			{error && (
				<p style={{ color: "red" }} data-testid="error-message">
					{error}
				</p>
			)}
			<table data-testid="events-table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Date</th>
						<th>Available Seats</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{events.map((event) => (
						<tr key={event.id} data-testid={`event-row-${event.id}`}>
							<td>{event.title}</td>
							<td>{new Date(event.event_date).toLocaleDateString()}</td>
							<td>{event.available_seats}</td>
							<td>
								<Link
									to={`/events/${event.id}`}
									data-testid={`view-event-${event.id}`}
								>
									View Details
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
