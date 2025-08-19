import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';
import AppLayout from './ui/AppLayout.jsx';
import LoginPage from './ui/LoginPage.jsx';
import RegisterPage from './ui/RegisterPage.jsx';
import ChatPage from './ui/ChatPage.jsx';
import ProfilePage from './ui/ProfilePage.jsx';
import RequestsPage from './ui/RequestsPage.jsx';

const router = createBrowserRouter([
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{ index: true, element: <ChatPage /> },
			{ path: 'profile', element: <ProfilePage /> },
			{ path: 'requests', element: <RequestsPage /> }
		]
	},
	{ path: '/login', element: <LoginPage /> },
	{ path: '/register', element: <RegisterPage /> }
]);

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
