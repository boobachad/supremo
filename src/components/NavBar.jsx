import { Link, useNavigate } from "react-router-dom";

export default function NavBar({ token, setToken }) {
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem("token");
		setToken(null);
		navigate("/login");
	};

	return (
		<nav
			style={{
				padding: "10px",
				display: "flex",
				gap: "10px",
			}}
		>
			<Link to="/" data-testid="nav-home">
				Home
			</Link>
			<Link to="/events" data-testid="nav-events">
				Events
			</Link>
			{token ? (
				<>
					<Link to="/my-bookings" data-testid="nav-my-bookings">
						My Bookings
					</Link>
					<button
						type="button"
						onClick={handleLogout}
						data-testid="logout-button"
					>
						Logout
					</button>
				</>
			) : (
				<>
					<Link to="/login" data-testid="nav-login">
						Login
					</Link>
					<Link to="/register" data-testid="nav-register">
						Register
					</Link>
				</>
			)}
		</nav>
	);
}
