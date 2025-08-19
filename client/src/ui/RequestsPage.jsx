import React from 'react';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';

export default function RequestsPage() {
	const [list, setList] = React.useState([]);
	const [title, setTitle] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [notification, setNotification] = React.useState(null);

	React.useEffect(() => { 
		load(); 
	}, []);

	React.useEffect(() => {
		const socket = getSocket();

		// Listen for new requests
		const onNewRequest = (request) => {
			setList(prev => [request, ...prev]);
			showNotification(`New request: ${request.title}`);
		};

		// Listen for request updates
		const onRequestUpdate = (updatedRequest) => {
			setList(prev => prev.map(r => r._id === updatedRequest._id ? updatedRequest : r));
			showNotification(`Request updated: ${updatedRequest.title}`);
		};

		socket.on('request:new', onNewRequest);
		socket.on('request:updated', onRequestUpdate);

		return () => {
			socket.off('request:new', onNewRequest);
			socket.off('request:updated', onRequestUpdate);
		};
	}, []);

	function showNotification(message) {
		setNotification(message);
		setTimeout(() => setNotification(null), 5000);
	}

	async function load() {
		try {
			const { data } = await api.get('/requests');
			setList(data);
		} catch (error) {
			console.error('Failed to load requests:', error);
		}
	}

	async function createRequest() {
		if (!title.trim()) return;
		
		try {
			await api.post('/requests', { title, description });
			setTitle(''); 
			setDescription('');
		} catch (error) {
			console.error('Failed to create request:', error);
			alert('Failed to create request. Please try again.');
		}
	}

	async function closeRequest(id) {
		try {
			await api.post(`/requests/${id}/close`);
		} catch (error) {
			console.error('Failed to close request:', error);
			alert('Failed to close request. Please try again.');
		}
	}

	function getStatusColor(status) {
		switch (status) {
			case 'open': return 'bg-yellow-100 text-yellow-800';
			case 'awaiting_info': return 'bg-blue-100 text-blue-800';
			case 'resolved': return 'bg-green-100 text-green-800';
			case 'closed': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	return (
		<div className="p-6 max-w-5xl mx-auto">
			{/* Notification */}
			{notification && (
				<div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
					{notification}
				</div>
			)}

			<h2 className="text-xl font-semibold text-blue-600 mb-4">Customer Requests</h2>
			
			<div className="bg-blue-50 p-4 rounded mb-6">
				<div className="grid md:grid-cols-2 gap-3">
					<input 
						placeholder="Title" 
						value={title} 
						onChange={(e) => setTitle(e.target.value)}
						className="border rounded px-3 py-2" 
					/>
					<input 
						placeholder="Description" 
						value={description} 
						onChange={(e) => setDescription(e.target.value)}
						className="border rounded px-3 py-2" 
					/>
				</div>
				<button 
					onClick={createRequest} 
					className="mt-3 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
					disabled={!title.trim()}
				>
					Create Request
				</button>
			</div>

			<div className="grid gap-4">
				{list.length === 0 ? (
					<div className="text-center text-gray-500 py-8">
						No requests yet. Create your first request above!
					</div>
				) : (
					list.map((r) => (
						<div key={r._id} className="border rounded p-4 bg-white shadow-sm">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<h3 className="font-semibold text-lg">{r.title}</h3>
										<span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(r.status)}`}>
											{r.status.replace('_', ' ')}
										</span>
									</div>
									{r.description && (
										<p className="text-gray-600 mb-3">{r.description}</p>
									)}
									<div className="text-xs text-gray-500">
										Created: {new Date(r.createdAt).toLocaleString()}
										{r.updatedAt !== r.createdAt && (
											<span> • Updated: {new Date(r.updatedAt).toLocaleString()}</span>
										)}
									</div>
									
									{/* Solutions */}
									{r.solutions && r.solutions.length > 0 && (
										<div className="mt-3">
											<h4 className="font-medium text-sm mb-2">Solutions:</h4>
											<div className="space-y-2">
												{r.solutions.map((solution, index) => (
													<div key={index} className="bg-gray-50 p-2 rounded text-sm">
														{solution.message}
														{solution.attachments && solution.attachments.length > 0 && (
															<div className="mt-1">
																{solution.attachments.map((att, i) => (
																	<a 
																		key={i} 
																		href={att.url} 
																		target="_blank" 
																		rel="noreferrer"
																		className="text-blue-600 text-xs hover:underline"
																	>
																		📎 {att.name || 'Attachment'}
																	</a>
																))}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</div>
								
								<div className="flex flex-col gap-2 ml-4">
									{r.status !== 'closed' && (
										<button 
											onClick={() => closeRequest(r._id)} 
											className="bg-red-600 text-white rounded px-3 py-1 text-sm hover:bg-red-700"
										>
											Close
										</button>
									)}
									{r.status === 'closed' && (
										<span className="text-gray-500 text-sm">Closed</span>
									)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
