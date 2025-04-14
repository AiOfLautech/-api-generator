const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true },
  sessionId: { type: String, required: true }
});

subscriberSchema.index({ email: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
