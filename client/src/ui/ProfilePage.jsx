import React from 'react';
import { api } from '../lib/api.js';

export default function ProfilePage() {
	const [profile, setProfile] = React.useState({ name: '', email: '', bio: '', avatarUrl: '' });
	const [message, setMessage] = React.useState('');

	React.useEffect(() => {
		load();
	}, []);

	async function load() {
		const { data } = await api.get('/auth/me');
		setProfile(data);
	}

	async function save() {
		const { data } = await api.put('/auth/me', profile);
		setProfile(data);
		setMessage('Profile updated');
		setTimeout(() => setMessage(''), 1500);
	}

	return (
		<div className="max-w-3xl mx-auto p-6">
			<h2 className="text-xl font-semibold text-blue-600 mb-4">Profile</h2>
			{message && <div className="mb-3 text-green-700">{message}</div>}
			<div className="flex gap-6 items-start">
				<img src={profile.avatarUrl || 'https://via.placeholder.com/96'} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
				<div className="flex-1">
					<label className="block text-sm font-medium">Avatar URL</label>
					<input value={profile.avatarUrl || ''} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} className="w-full border rounded px-3 py-2 mb-4" />
					<label className="block text-sm font-medium">Name</label>
					<input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full border rounded px-3 py-2 mb-4" />
					<label className="block text-sm font-medium">Bio</label>
					<textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full border rounded px-3 py-2 mb-4" />
					<button onClick={save} className="bg-blue-600 text-white rounded px-4 py-2">Save</button>
				</div>
			</div>
		</div>
	);
}
