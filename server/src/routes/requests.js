import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';

const RequestSchema = new mongoose.Schema(
	{
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		title: { type: String, required: true },
		description: { type: String, default: '' },
		status: { type: String, enum: ['open', 'awaiting_info', 'resolved', 'closed'], default: 'open' },
		solutions: [
			{
				message: { type: String, required: true },
				attachments: [
					{ type: { type: String }, url: String, name: String, size: Number }
				]
			}
		]
	},
	{ timestamps: true }
);

const Request = mongoose.model('Request', RequestSchema);

const router = express.Router();

// Create request (customer)
router.post('/', requireAuth, async (req, res, next) => {
	try {
		const { title, description } = req.body;
		const r = await Request.create({ createdBy: req.user.id, title, description });
		
		// Broadcast to all connected clients
		const io = req.app.get('io');
		io.emit('request:new', r);
		
		res.json(r);
	} catch (e) { next(e); }
});

// Add solution or ask info (agent)
router.post('/:id/solution', requireAuth, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { message, attachments = [] } = req.body;
		const r = await Request.findById(id);
		if (!r) return res.status(404).json({ error: 'Not found' });
		r.solutions.push({ message, attachments });
		r.status = 'awaiting_info';
		await r.save();
		
		// Broadcast update to all connected clients
		const io = req.app.get('io');
		io.emit('request:updated', r);
		
		res.json(r);
	} catch (e) { next(e); }
});

// Close request (customer)
router.post('/:id/close', requireAuth, async (req, res, next) => {
	try {
		const { id } = req.params;
		const r = await Request.findById(id);
		if (!r) return res.status(404).json({ error: 'Not found' });
		if (String(r.createdBy) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		r.status = 'closed';
		await r.save();
		
		// Broadcast update to all connected clients
		const io = req.app.get('io');
		io.emit('request:updated', r);
		
		res.json(r);
	} catch (e) { next(e); }
});

// List requests for current user (created or assigned)
router.get('/', requireAuth, async (req, res, next) => {
	try {
		const list = await Request.find({ $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }] }).sort({ updatedAt: -1 });
		res.json(list);
	} catch (e) { next(e); }
});

// Get all requests (for admin/agent view)
router.get('/all', requireAuth, async (req, res, next) => {
	try {
		const list = await Request.find({}).populate('createdBy', 'name email').sort({ updatedAt: -1 });
		res.json(list);
	} catch (e) { next(e); }
});

export default router;
