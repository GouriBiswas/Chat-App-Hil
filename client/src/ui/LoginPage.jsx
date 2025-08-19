import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [error, setError] = React.useState('');

	async function onSubmit(e) {
		e.preventDefault();
		setError('');
		try {
			const { data } = await api.post('/auth/login', { email, password });
			localStorage.setItem('token', data.token);
			localStorage.setItem('userId', data.user.id);
			navigate('/');
		} catch (e) {
			setError(e.response?.data?.error || 'Login failed');
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
			<form onSubmit={onSubmit} className="bg-white rounded shadow p-6 w-full max-w-md">
				<h2 className="text-2xl font-bold text-blue-600 mb-4">Welcome back</h2>
				{error && <div className="text-red-600 mb-2">{error}</div>}
				<label className="block mb-2 text-sm font-medium">Email</label>
				<input className="w-full border rounded px-3 py-2 mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />
				<label className="block mb-2 text-sm font-medium">Password</label>
				<input type="password" className="w-full border rounded px-3 py-2 mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />
				<button className="w-full bg-blue-600 text-white rounded py-2 font-semibold">Login</button>
				<p className="text-sm mt-3 text-center">No account? <Link className="text-blue-600" to="/register">Register</Link></p>
			</form>
		</div>
	);
}
