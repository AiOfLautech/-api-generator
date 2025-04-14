const mongoose = require('mongoose');

const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://godwinhephzibah25:kzdz0iKbfpai1ipo@cluster0.da67b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;
