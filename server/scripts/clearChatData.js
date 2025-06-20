const mongoose = require('mongoose');
const Message = require('./models/messageModel');

// Database cleanup script - removes all chat data
async function clearChatData() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Clear all messages
    const messageResult = await Message.deleteMany({});
    console.log(`✅ Deleted ${messageResult.deletedCount} messages`);
    
    console.log('🎉 Database cleanup completed successfully!');
    console.log('📝 User accounts preserved, only chat data removed');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  }
}

module.exports = { clearChatData };
