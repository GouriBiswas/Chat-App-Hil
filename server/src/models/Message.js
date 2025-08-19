import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		emoji: { type: String, required: true }
	},
	{ _id: false }
);

const AttachmentSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ['image', 'video', 'document'], required: true },
		url: { type: String, required: true },
		name: { type: String },
		size: { type: Number }
	},
	{ _id: false }
);

const MessageSchema = new mongoose.Schema(
	{
		chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true, required: true },
		sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		text: { type: String, default: '' },
		attachments: [AttachmentSchema],
		reactions: [ReactionSchema],
		readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
	},
	{ timestamps: true }
);

MessageSchema.index({ text: 'text' });

export default mongoose.model('Message', MessageSchema);
