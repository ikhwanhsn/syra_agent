import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

const connectMongoose = async () => {
  if (isConnected) {
    console.log('Mongoose already connected');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB (Mongoose) Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB (Mongoose) connection error:', error.message);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB (Mongoose) disconnected');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB (Mongoose) error:', err);
});

export default connectMongoose;
