import React from 'react';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function ChatPage() {
	const [chats, setChats] = React.useState([]);
	const [activeChat, setActiveChat] = React.useState(null);
	const [messages, setMessages] = React.useState([]);
	const [text, setText] = React.useState('');
	const [showEmoji, setShowEmoji] = React.useState(false);
	const [search, setSearch] = React.useState('');
	const [users, setUsers] = React.useState([]);
	const [onlineUsers, setOnlineUsers] = React.useState([]);
	const [isTyping, setIsTyping] = React.useState(false);
	const [filePreview, setFilePreview] = React.useState(null);
	const [isUploading, setIsUploading] = React.useState(false);
	const fileInputRef = React.useRef(null);

	React.useEffect(() => {
		loadChats();
		loadUsers();
		loadOnlineUsers();
	}, []);

	React.useEffect(() => {
		const socket = getSocket();
		
		// Join chat room when active chat changes
		if (activeChat) {
			socket.emit('chat:join', { chatId: activeChat._id });
		}

		// Listen for new messages
		const onNewMessage = (msg) => {
			if (msg.chat === activeChat?._id) {
				setMessages((prev) => [...prev, msg]);
			}
			// Refresh chat list to update last message
			loadChats();
		};

		// Listen for typing indicators
		const onTyping = ({ chatId, userId, typing }) => {
			if (chatId === activeChat?._id && userId !== localStorage.getItem('userId')) {
				setIsTyping(typing);
			}
		};

		// Listen for user online/offline events
		const onUserOnline = ({ userId }) => {
			setOnlineUsers(prev => [...prev, userId]);
		};

		const onUserOffline = ({ userId }) => {
			setOnlineUsers(prev => prev.filter(id => id !== userId));
		};

		socket.on('message:new', onNewMessage);
		socket.on('chat:typing', onTyping);
		socket.on('user:online', onUserOnline);
		socket.on('user:offline', onUserOffline);

		return () => {
			socket.off('message:new', onNewMessage);
			socket.off('chat:typing', onTyping);
			socket.off('user:online', onUserOnline);
			socket.off('user:offline', onUserOffline);
		};
	}, [activeChat]);

	async function loadChats() {
		try {
			const { data } = await api.get('/chats');
			setChats(data);
			if (data.length && !activeChat) {
				selectChat(data[0]);
			}
		} catch (error) {
			console.error('Failed to load chats:', error);
		}
	}

	async function loadUsers() {
		try {
			const { data } = await api.get('/users/all');
			setUsers(data);
		} catch (error) {
			console.error('Failed to load users:', error);
		}
	}

	async function loadOnlineUsers() {
		try {
			const { data } = await api.get('/users/online');
			setOnlineUsers(data.map(u => u._id));
		} catch (error) {
			console.error('Failed to load online users:', error);
		}
	}

	async function selectChat(chat) {
		setActiveChat(chat);
		try {
			const { data } = await api.get(`/messages/${chat._id}`);
			setMessages(data);
		} catch (error) {
			console.error('Failed to load messages:', error);
		}
	}

	function handleFileSelect(e) {
		const file = e.target.files[0];
		if (!file) return;

		// Check file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size must be less than 5MB');
			return;
		}

		// Check if it's an image
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setFilePreview({
					file,
					preview: e.target.result,
					type: 'image'
				});
			};
			reader.readAsDataURL(file);
		} else {
			setFilePreview({
				file,
				preview: null,
				type: 'document'
			});
		}
	}

	function removeFilePreview() {
		setFilePreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}

	async function sendMessage() {
		if (!activeChat || (!text.trim() && !filePreview)) return;
		
		setIsUploading(true);
		try {
			let attachments = [];
			
			if (filePreview) {
				const form = new FormData();
				form.append('file', filePreview.file);
				const up = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
				const mime = filePreview.file.type || '';
				const type = mime.startsWith('image') ? 'image' : mime.startsWith('video') ? 'video' : 'document';
				attachments = [{ type, url: up.data.url, name: filePreview.file.name, size: filePreview.file.size }];
			}
			
			const { data } = await api.post(`/messages/${activeChat._id}`, { text, attachments });
			setText('');
			setFilePreview(null);
			//yaha issue hai ek : reminder karna hai ki jab koi message send karega toh uske baad chat list update ho jaye
			setMessages((prev) => [...prev, data]);
		} catch (error) {
			console.error('Failed to send message:', error);
			alert('Failed to send message. Please try again.');
		} finally {
			setIsUploading(false);
		}
	}

	async function addReaction(messageId, emoji) {
		try {
			await api.post(`/messages/${activeChat._id}/${messageId}/react`, { emoji });
		} catch (error) {
			console.error('Failed to add reaction:', error);
		}
	}

	async function newChat() {
		const email = window.prompt('Enter user email to start a chat:');
		if (!email) return;
		
		try {
			const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
			
			if (!user) {
				alert('User not found. Please check the email address.');
				return;
			}
			
			const { data: chat } = await api.post('/chats/dm', { userId: user._id });
			await loadChats();
			selectChat(chat);
		} catch (error) {
			console.error('Failed to create chat:', error);
			alert('Failed to create chat. Please try again.');
		}
	}

	async function newGroup() {
		const name = window.prompt('Group name?');
		if (!name) return;
		
		// Show available users for selection
		const userList = users.map(u => `${u.name} (${u.email})${onlineUsers.includes(u._id) ? ' 🟢' : ' ⚪'}`).join('\n');
		const selectedEmails = window.prompt(`Available users:\n${userList}\n\nEnter member emails (comma-separated):`);
		
		if (!selectedEmails) return;
		
		try {
			const emailList = selectedEmails.split(',').map(e => e.trim()).filter(Boolean);
			const memberIds = [];
			
			for (const email of emailList) {
				const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
				if (user) memberIds.push(user._id);
			}
			
			if (memberIds.length === 0) {
				alert('No valid users found. Please check the email addresses.');
				return;
			}
			
			const { data: chat } = await api.post('/chats/group', { name, memberIds });
			await loadChats();
			selectChat(chat);
		} catch (error) {
			console.error('Failed to create group:', error);
			alert('Failed to create group. Please try again.');
		}
	}

	function handleKeyPress(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function handleTyping(e) {
		setText(e.target.value);
		const socket = getSocket();
		if (activeChat) {
			socket.emit('chat:typing', { chatId: activeChat._id, userId: localStorage.getItem('userId'), typing: true });
			// Clear typing indicator after 2 seconds
			setTimeout(() => {
				socket.emit('chat:typing', { chatId: activeChat._id, userId: localStorage.getItem('userId'), typing: false });
			}, 2000);
		}
	}

	const filteredChats = search ? chats.filter(c => (c.name || 'Direct Chat').toLowerCase().includes(search.toLowerCase())) : chats;

	return (
		<div className="grid grid-cols-12 h-screen">
			<section className="col-span-4 lg:col-span-3 border-r flex flex-col">
				<div className="p-3 border-b">
					<input 
						className="w-full border rounded px-3 py-2" 
						placeholder="Search chats" 
						value={search} 
						onChange={(e) => setSearch(e.target.value)} 
					/>
				</div>
				<div className="flex-1 overflow-y-auto">
					{filteredChats.map((c) => (
						<button 
							key={c._id} 
							onClick={() => selectChat(c)} 
							className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-blue-50 ${activeChat?._id===c._id ? 'bg-blue-100' : ''}`}
						>
							<div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
								{c.isGroup ? '👥' : '👤'}
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-semibold truncate">{c.isGroup ? c.name : 'Direct Chat'}</div>
								<div className="text-xs text-gray-500">{new Date(c.updatedAt).toLocaleString()}</div>
							</div>
						</button>
					))}
				</div>
				<div className="p-3 border-t flex gap-2">
					<button onClick={newChat} className="bg-blue-600 text-white px-3 py-2 rounded text-sm">New Chat</button>
					<button onClick={newGroup} className="bg-blue-600 text-white px-3 py-2 rounded text-sm">New Group</button>
				</div>
			</section>
			<section className="col-span-8 lg:col-span-9 flex flex-col">
				<div className="p-3 border-b flex items-center justify-between">
					<h2 className="font-semibold text-blue-600">
						{activeChat?.isGroup ? activeChat?.name : 'Direct Chat'}
					</h2>
					{isTyping && <span className="text-sm text-gray-500">Someone is typing...</span>}
				</div>
				<div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
					{messages.length === 0 ? (
						<div className="text-center text-gray-500 mt-8">
							No messages yet. Start the conversation!
						</div>
					) : (
						messages.map((m) => (
							<div key={m._id} className="max-w-lg">
								<div className="inline-block bg-blue-50 rounded px-3 py-2">
									{m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
									{m.attachments?.map((a, i) => (
										<div key={i} className="mt-2">
											{a.type === 'image' && (
												<img 
													src={a.url} 
													alt={a.name} 
													className="max-w-xs max-h-64 rounded object-cover cursor-pointer hover:opacity-90" 
													onClick={() => window.open(a.url, '_blank')}
												/>
											)}
											{a.type === 'video' && <video src={a.url} controls className="max-w-xs rounded" />}
											{a.type === 'document' && <a className="text-blue-600 underline" href={a.url} target="_blank" rel="noreferrer">{a.name || 'Document'}</a>}
										</div>
									))}
								</div>
								<div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
									<span>{new Date(m.createdAt).toLocaleTimeString()}</span>
									<div className="flex gap-1">
										{['👍','❤️','😂','😮','😢','👏'].map((e) => (
											<button key={e} onClick={() => addReaction(m._id, e)} className="hover:opacity-70">{e}</button>
										))}
									</div>
								</div>
							</div>
						))
					)}
				</div>
				
				{/* File Preview */}
				{filePreview && (
					<div className="p-3 border-t bg-gray-50">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-sm font-medium">Preview:</span>
							<button onClick={removeFilePreview} className="text-red-500 text-sm">✕ Remove</button>
						</div>
						{filePreview.type === 'image' && (
							<div className="relative inline-block">
								<img 
									src={filePreview.preview} 
									alt="Preview" 
									className="max-w-xs max-h-32 rounded object-cover border"
								/>
							</div>
						)}
						{filePreview.type === 'document' && (
							<div className="text-sm text-gray-600">
								📎 {filePreview.file.name} ({(filePreview.file.size / 1024).toFixed(1)} KB)
							</div>
						)}
					</div>
				)}

				<div className="p-3 border-t">
					<div className="flex items-center gap-2">
						<input 
							value={text} 
							onChange={handleTyping}
							onKeyPress={handleKeyPress}
							placeholder="Type a message (Enter to send)" 
							className="flex-1 border rounded px-3 py-2" 
							disabled={isUploading}
						/>
						<input 
							ref={fileInputRef} 
							type="file" 
							className="hidden" 
							onChange={handleFileSelect}
							accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
						/>
						<button 
							onClick={() => fileInputRef.current?.click()} 
							className="px-3 py-2 rounded bg-blue-50 hover:bg-blue-100"
							disabled={isUploading}
						>
							📎
						</button>
						<div className="relative">
							<button 
								onClick={() => setShowEmoji((s) => !s)} 
								className="px-3 py-2 rounded bg-blue-50 hover:bg-blue-100"
								disabled={isUploading}
							>
								😊
							</button>
							{showEmoji && (
								<div className="absolute bottom-12 right-0 z-10">
									<Picker data={data} onEmojiSelect={(e) => setText((t) => t + e.native)} theme="light" />
								</div>
							)}
						</div>
						<button 
							onClick={sendMessage} 
							className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
							disabled={isUploading || (!text.trim() && !filePreview)}
						>
							{isUploading ? 'Sending...' : 'Send'}
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
