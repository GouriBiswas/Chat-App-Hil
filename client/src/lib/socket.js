import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket = null;

export function getSocket() {
	if (!socket) {
		const token = localStorage.getItem('token');
		if (!token) {
			throw new Error('No authentication token found');
		}
		
		socket = io(API_URL, { 
			auth: { token },
			withCredentials: true 
		});

		socket.on('connect', () => {
			console.log('Connected to server');
		});

		socket.on('disconnect', () => {
			console.log('Disconnected from server');
		});

		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error);
			if (error.message === 'Authentication error') {
				localStorage.removeItem('token');
				localStorage.removeItem('userId');
				window.location.href = '/login';
			}
		});
	}
	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}
