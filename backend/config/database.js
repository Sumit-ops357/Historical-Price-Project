const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('⚠️  MongoDB not available - using in-memory storage for demo');
    isConnected = false;
    // Don't exit process, let the app continue with in-memory storage
  }
};

const isDBConnected = () => isConnected;

module.exports = { connectDB, isDBConnected }; 