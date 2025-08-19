import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hitachi_chatapp',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || 'http://localhost:4000',
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  s3: {
    region: process.env.S3_REGION || '',
    bucket: process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
  }
};
