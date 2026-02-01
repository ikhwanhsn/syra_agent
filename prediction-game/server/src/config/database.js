import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {});

mongoose.connection.on('error', () => {});

export default connectDB;
