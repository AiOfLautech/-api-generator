const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  telegramBotToken: { type: String, required: true },
  telegramChatId: { type: String, required: true },
  gmailEmail: { type: String, required: true },
  gmailAppPassword: { type: String, required: true },
  emailTemplate: { type: String, required: true }
});

module.exports = mongoose.model('Config', configSchema);
