import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');
if (config.storageDriver === 'local') {
	try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}

const localStorage = multer.diskStorage({
	destination: uploadsDir,
	filename: (req, file, cb) => {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, unique + '-' + file.originalname);
	}
});

const storage = config.storageDriver === 's3' ? multer.memoryStorage() : localStorage;
const upload = multer({ storage });
const router = express.Router();

router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
	try {
		if (config.storageDriver === 's3') {
			const client = new S3Client({
				region: config.s3.region,
				credentials: config.s3.accessKeyId && config.s3.secretAccessKey ? {
					accessKeyId: config.s3.accessKeyId,
					secretAccessKey: config.s3.secretAccessKey
				} : undefined
			});
			const key = `${Date.now()}-${req.file.originalname}`;
			await client.send(new PutObjectCommand({
				Bucket: config.s3.bucket,
				Key: key,
				Body: req.file.buffer,
				ContentType: req.file.mimetype
			}));
			const url = `https://s3.${config.s3.region}.amazonaws.com/${config.s3.bucket}/${key}`;
			return res.json({ url });
		}
		// Local fallback
		const url = `${config.baseUrl}/uploads/${req.file.filename}`;
		res.json({ url });
	} catch (e) { next(e); }
});

export default router;
