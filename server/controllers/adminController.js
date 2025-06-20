module.exports.clearAllChatData = async (req, res, next) => {
  try {
    const Message = require('../models/messageModel');
    
    // Clear all messages
    const messageResult = await Message.deleteMany({});
    
    console.log(`✅ Deleted ${messageResult.deletedCount} messages`);
    
    return res.json({ 
      status: true, 
      message: `Successfully deleted ${messageResult.deletedCount} messages`,
      deletedMessages: messageResult.deletedCount
    });
  } catch (ex) {
    console.error('❌ Error clearing chat data:', ex);
    return res.json({ 
      status: false, 
      message: 'Failed to clear chat data',
      error: ex.message 
    });
  }
};
