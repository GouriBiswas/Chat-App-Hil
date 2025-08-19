import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';

export default function AppLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const [requestCount, setRequestCount] = React.useState(0);

	React.useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token && location.pathname !== '/login' && location.pathname !== '/register') {
			navigate('/login');
		}
	}, [location.pathname, navigate]);

	React.useEffect(() => {
		const socket = getSocket();

		// Listen for new requests to update badge
		const onNewRequest = () => {
			setRequestCount(prev => prev + 1);
		};

		socket.on('request:new', onNewRequest);

		return () => {
			socket.off('request:new', onNewRequest);
		};
	}, []);

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		navigate('/login');
	}

	function handleRequestsClick() {
		setRequestCount(0); // Clear notification when visiting requests page
	}

	return (
		<div className="min-h-screen grid grid-cols-12">
			<aside className="col-span-3 lg:col-span-2 bg-blue-600 text-white p-4 flex flex-col gap-3">
				<h1 className="text-xl font-bold">Hitachi Chat</h1>
				<nav className="flex-1 flex flex-col gap-2">
					<Link className="hover:bg-blue-500 rounded px-2 py-1" to="/">Chats</Link>
					<Link 
						className="hover:bg-blue-500 rounded px-2 py-1 relative" 
						to="/requests"
						onClick={handleRequestsClick}
					>
						Requests
						{requestCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
								{requestCount > 9 ? '9+' : requestCount}
							</span>
						)}
					</Link>
					<Link className="hover:bg-blue-500 rounded px-2 py-1" to="/profile">Profile</Link>
				</nav>
				<button onClick={logout} className="bg-white text-blue-600 rounded px-3 py-2 font-medium">Logout</button>
			</aside>
			<main className="col-span-9 lg:col-span-10 bg-white">
				<Outlet />
			</main>
		</div>
	);
}
