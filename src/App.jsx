import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import Events from "./pages/Events.jsx";
import Login from "./pages/Login.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
	const [token, setToken] = useState(localStorage.getItem("token"));

	useEffect(() => {
		const handleStorageChange = () => {
			setToken(localStorage.getItem("token"));
		};
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	return (
		<Router>
			<NavBar token={token} setToken={setToken} />
			<div style={{ padding: "20px" }}>
				<Routes>
					<Route path="/" element={<Events />} />
					<Route path="/login" element={<Login setToken={setToken} />} />
					<Route path="/register" element={<Register />} />
					<Route path="/events" element={<Events />} />
					<Route path="/events/:id" element={<EventDetail token={token} />} />
					<Route path="/my-bookings" element={<MyBookings token={token} />} />
				</Routes>
			</div>
		</Router>
	);
}
