import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true, index: true },
		passwordHash: { type: String, required: true },
		avatarUrl: { type: String },
		bio: { type: String, default: '' }
	},
	{ timestamps: true }
);

export default mongoose.model('User', UserSchema);
