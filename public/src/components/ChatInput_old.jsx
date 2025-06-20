import React, { useState } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import styled from "styled-components";
import Picker from "emoji-picker-react";

export default function ChatInput({ handleSendMsg }) {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleEmojiPickerhideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (event, emojiObject) => {
    let message = msg;
    message += emojiObject.emoji;
    setMsg(message);
  };

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.length > 0) {
      handleSendMsg(msg);
      setMsg("");
      setShowEmojiPicker(false);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  return (
    <Container>
      <form className="input-container" onSubmit={(event) => sendChat(event)}>
        <div className="input-wrapper">
          {/* Attachment Button */}
          <button type="button" className="attachment-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          {/* Text Input */}
          <div className="text-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              onChange={(e) => setMsg(e.target.value)}
              value={msg}
              className="text-input"
            />
            
            {/* Emoji Button */}
            <button type="button" className="emoji-btn" onClick={handleEmojiPickerhideShow}>
              <BsEmojiSmileFill />
            </button>
          </div>

          {/* Send/Voice Button */}
          {msg.length > 0 ? (
            <button type="submit" className="send-btn">
              <IoMdSend />
            </button>
          ) : (
            <button type="button" className={`voice-btn ${isRecording ? 'recording' : ''}`} onClick={handleVoiceRecord}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <div className="emoji-picker-header">
              <span>Choose an emoji</span>
              <button
                className="close-button"
                onClick={() => setShowEmojiPicker(false)}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <Picker
              onEmojiClick={handleEmojiClick}
              disableSearchBar={true}
              pickerStyle={{
                width: '100%',
                border: 'none',
                boxShadow: 'none'
              }}
            />
          </div>
        )}
      </form>
    </Container>
  );
}

const Container = styled.div`
  padding: 16px 20px 20px 20px;
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
  position: sticky;
  bottom: 0;
  z-index: 10;
  
  @media screen and (max-width: 768px) {
    padding: 12px 16px 16px 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
  
  .input-container {
    width: 100%;
    position: relative;
    
    .input-wrapper {
      display: flex;
      align-items: center;
      background: var(--background-color);
      border: 2px solid var(--border-color);
      border-radius: 30px;
      padding: 8px 12px;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      
      @media screen and (max-width: 768px) {
        border-radius: 25px;
        padding: 6px 10px;
        gap: 6px;
      }
      
      &:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.2);
      }
      
      .attachment-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-secondary-color);
        transition: all 0.3s ease;
        
        @media screen and (max-width: 768px) {
          width: 32px;
          height: 32px;
        }
        
        svg {
          width: 20px;
          height: 20px;
          
          @media screen and (max-width: 768px) {
            width: 18px;
            height: 18px;
          }
        }
        
        &:hover, &:active {
          background: var(--primary-color);
          color: white;
          transform: scale(1.1);
        }
      }
      
      .text-input-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        
        .text-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-color);
          font-size: 15px;
          font-family: var(--font-family);
          padding: 8px 0;
          
          @media screen and (max-width: 768px) {
            font-size: 16px;
            padding: 6px 0;
          }
          
          &::placeholder {
            color: var(--text-secondary-color);
          }
        }
        
        .emoji-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary-color);
          transition: all 0.3s ease;
          
          @media screen and (max-width: 768px) {
            width: 28px;
            height: 28px;
          }
          
          &:hover, &:active {
            background: var(--primary-color);
            color: white;
            transform: scale(1.1);
          }
          
          svg {
            font-size: 20px;
            
            @media screen and (max-width: 768px) {
              font-size: 18px;
            }
          }
        }
      }
      
      .send-btn, .voice-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: var(--primary-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
        
        @media screen and (max-width: 768px) {
          width: 36px;
          height: 36px;
        }
        
        svg {
          width: 20px;
          height: 20px;
          
          @media screen and (max-width: 768px) {
            width: 18px;
            height: 18px;
          }
        }
        
        &:hover {
          background: #8b5cf6;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        
        &:active {
          transform: scale(0.95);
        }
        
        &.recording {
          background: #ef4444;
          animation: pulse 1s infinite;
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        }
      }
    }
    
    .emoji-picker-container {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      margin-bottom: 8px;
      overflow: hidden;
      z-index: 1000;
      
      @media screen and (max-width: 768px) {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        border-radius: 16px 16px 0 0;
        max-height: 60vh;
      }
      
      .emoji-picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        background: var(--background-color);
        
        span {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-color);
        }
        
        .close-button {
          width: 28px;
          height: 28px;
          border: none;
          background: var(--background-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary-color);
          transition: all 0.3s ease;
          
          &:hover, &:active {
            background: var(--primary-color);
            color: white;
            transform: scale(1.1);
          }
        }
      }
    }
  }
`;
