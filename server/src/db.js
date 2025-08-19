import mongoose from 'mongoose';

export async function connectToDatabase(uri) {
	mongoose.set('strictQuery', false);
	await mongoose.connect(uri, {
		autoIndex: true
	});
	console.log('Connected to MongoDB');
}
