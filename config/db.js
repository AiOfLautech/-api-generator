const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL || 'your-mongodb-connection-string';
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
