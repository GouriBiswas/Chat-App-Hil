import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema(
	{
		isGroup: { type: Boolean, default: false },
		name: { type: String },
		members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		lastMessageAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
);

ChatSchema.index({ members: 1 });

export default mongoose.model('Chat', ChatSchema);
