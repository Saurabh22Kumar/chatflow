import React, { useState, useRef } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { FiPaperclip, FiMic, FiMicOff, FiImage, FiFile } from "react-icons/fi";
import styled from "styled-components";
import Picker from "emoji-picker-react";
import axios from "axios";
import { uploadPhotoRoute, uploadFileRoute } from "../utils/APIRoutes";
import { toast } from "react-toastify";

export default function ChatInput({ handleSendMsg, currentUser, currentChat }) {
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

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

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          await uploadVoiceMessage(audioBlob);
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        
        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        toast.success("Recording started...");
        
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Could not access microphone. Please allow microphone permission.");
      }
    } else {
      // Stop recording and send
      stopRecording();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    audioChunksRef.current = [];
    toast.info("Recording cancelled");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadVoiceMessage = async (audioBlob) => {
    if (audioBlob.size === 0) {
      toast.error("Recording is empty");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('voice', audioBlob, 'voice-message.webm');
      formData.append('from', currentUser._id);
      formData.append('to', currentChat._id);

      console.log('Uploading voice message:', {
        blobSize: audioBlob.size,
        from: currentUser._id,
        to: currentChat._id,
        url: `${uploadFileRoute}/voice`
      });

      const response = await axios.post(`${uploadFileRoute}/voice`, formData, {
        timeout: 30000, // 30 second timeout
        // Don't set Content-Type header, let axios handle it
      });

      if (response.data.msg) {
        // Send the voice message through the existing handleSendMsg with additional data
        handleSendMsg(`🎵 Voice message (${formatTime(recordingTime)})`, {
          messageType: 'voice',
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName,
          fileSize: response.data.fileSize,
          duration: recordingTime,
          messageId: response.data.messageId
        });
        
        toast.success("Voice message sent!");
      }
    } catch (error) {
      console.error("Error uploading voice message:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error("Failed to send voice message");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoUpload = () => {
    photoInputRef.current?.click();
    setShowAttachments(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setShowAttachments(false);
  };

  const validateFileSize = (file, maxSize, type) => {
    if (file.size > maxSize) {
      const maxSizeKB = maxSize / 1024;
      toast.error(`${type} size must be less than ${maxSizeKB}KB`);
      return false;
    }
    return true;
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate photo size (100KB)
    if (!validateFileSize(file, 100 * 1024, 'Photo')) {
      return;
    }

    // Validate photo type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('from', currentUser._id);
      formData.append('to', currentChat._id);

      const response = await axios.post(uploadPhotoRoute, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.msg) {
        // Send the file message through the existing handleSendMsg with additional data
        handleSendMsg(response.data.fileName, {
          messageType: 'image',
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName,
          fileSize: response.data.fileSize,
          messageId: response.data.messageId
        });
        toast.success('Photo uploaded successfully!');
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      if (error.response?.data?.msg) {
        toast.error(error.response.data.msg);
      } else {
        toast.error('Failed to upload photo. Please try again.');
      }
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (200KB)
    if (!validateFileSize(file, 200 * 1024, 'File')) {
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, DOCX, TXT, ZIP, and RAR files are allowed');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('from', currentUser._id);
      formData.append('to', currentChat._id);

      const response = await axios.post(uploadFileRoute, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.msg) {
        // Send the file message through the existing handleSendMsg with additional data
        handleSendMsg(response.data.fileName, {
          messageType: 'file',
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName,
          fileSize: response.data.fileSize,
          messageId: response.data.messageId
        });
        toast.success('File uploaded successfully!');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      if (error.response?.data?.msg) {
        toast.error(error.response.data.msg);
      } else {
        toast.error('Failed to upload file. Please try again.');
      }
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Container>
      <form className="input-container" onSubmit={(event) => sendChat(event)}>
        <div className="input-wrapper">
          {/* Attachment Button */}
          <div className="attachment-container">
            <button 
              type="button" 
              className="attachment-btn"
              onClick={() => setShowAttachments(!showAttachments)}
            >
              <FiPaperclip />
            </button>
            
            {/* Attachment Options */}
            {showAttachments && (
              <div className="attachment-options">
                <button 
                  type="button" 
                  className="attachment-option" 
                  title="Photos & Videos"
                  onClick={handlePhotoUpload}
                  disabled={isUploading}
                >
                  <FiImage />
                  <span>Photos</span>
                </button>
                <button 
                  type="button" 
                  className="attachment-option" 
                  title="Documents"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                >
                  <FiFile />
                  <span>Files</span>
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={photoInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={uploadPhoto}
            />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
              onChange={uploadFile}
            />
          </div>

          {/* Text Input */}
          <div className="text-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              onChange={(e) => setMsg(e.target.value)}
              value={msg}
              className="text-input"
              autoComplete="off"
            />
            
            {/* Emoji Button */}
            <button 
              type="button" 
              className="emoji-btn" 
              onClick={handleEmojiPickerhideShow}
              title="Add emoji"
            >
              <BsEmojiSmileFill />
            </button>
          </div>

          {/* Send/Voice Button */}
          {msg.length > 0 || isUploading ? (
            <button 
              type="submit" 
              className="send-btn" 
              title={isUploading ? "Uploading..." : "Send message"}
              disabled={isUploading}
            >
              {isUploading ? "..." : <IoMdSend />}
            </button>
          ) : (
            <div className="voice-control">
              {isRecording && (
                <div className="recording-info">
                  <span className="recording-time">{formatTime(recordingTime)}</span>
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={cancelRecording}
                    title="Cancel recording"
                  >
                    ×
                  </button>
                </div>
              )}
              <button 
                type="button" 
                className={`voice-btn ${isRecording ? 'recording' : ''}`} 
                onClick={handleVoiceRecord}
                title={isRecording ? "Send voice message" : "Record voice message"}
                disabled={isUploading}
              >
                {isRecording ? <IoMdSend /> : <FiMic />}
              </button>
            </div>
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
                title="Close emoji picker"
              >
                ×
              </button>
            </div>
            <Picker
              onEmojiClick={handleEmojiClick}
              disableSearchBar={true}
              pickerStyle={{
                width: '100%',
                boxShadow: 'none',
                border: 'none',
              }}
              skinTone="neutral"
            />
          </div>
        )}
      </form>
    </Container>
  );
}

const Container = styled.div`
  /* World-Class Chat Input Design */
  padding: 16px 20px 20px 20px;
  background: ${props => props.theme.surfaceElevated};
  border-top: 1px solid ${props => props.theme.surfaceBorder};
  position: sticky;
  bottom: 0;
  z-index: 100;
  backdrop-filter: ${props => props.theme.type === 'dark' ? props.theme.glassBlur : 'blur(20px)'};
  transition: all ${props => props.theme.transitionNormal};
  
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
      background: ${props => props.theme.background};
      border: 2px solid ${props => props.theme.surfaceBorder};
      border-radius: 28px;
      padding: 8px 12px;
      gap: 8px;
      transition: all ${props => props.theme.transitionNormal};
      box-shadow: ${props => props.theme.type === 'dark' 
        ? `0 2px 8px rgba(0, 0, 0, 0.3)`
        : `0 2px 8px rgba(0, 0, 0, 0.05)`
      };
      
      @media screen and (max-width: 768px) {
        border-radius: 24px;
        padding: 8px 12px;
        gap: 8px;
      }
      
      &:focus-within {
        border-color: ${props => props.theme.primary};
        box-shadow: ${props => props.theme.type === 'dark' 
          ? `0 4px 16px rgba(0, 255, 136, 0.2), 0 0 0 3px rgba(0, 255, 136, 0.1)`
          : `0 4px 16px rgba(99, 102, 241, 0.15), 0 0 0 3px rgba(99, 102, 241, 0.1)`
        };
        transform: translateY(-1px);
      }
      
      .attachment-container {
        position: relative;
        
        .attachment-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${props => props.theme.textTertiary};
          transition: all ${props => props.theme.transitionNormal};
          
          @media screen and (max-width: 768px) {
            width: 36px;
            height: 36px;
          }
          
          svg {
            font-size: 20px;
            width: 20px;
            height: 20px;
            
            @media screen and (max-width: 768px) {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
          
          &:hover {
            background: ${props => props.theme.type === 'dark' 
              ? `rgba(0, 255, 136, 0.1)`
              : `rgba(99, 102, 241, 0.1)`
            };
            color: ${props => props.theme.primary};
            transform: scale(1.05);
          }
          
          svg {
            font-size: 1.125rem;
            
            @media screen and (max-width: 768px) {
              font-size: 1rem;
            }
          }
          
          &:hover {
            background: var(--brand-secondary);
            color: white;
            transform: scale(1.1);
          }
        }
        
        .attachment-options {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: var(--surface-elevated);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--elevation-5);
          margin-bottom: var(--space-2);
          overflow: hidden;
          z-index: var(--z-popover);
          min-width: 8rem;
          
          .attachment-option {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            width: 100%;
            padding: var(--space-3);
            border: none;
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all var(--duration-fast) var(--ease-out);
            font-size: var(--font-size-sm);
            
            svg {
              font-size: 1rem;
            }
            
            &:hover {
              background: var(--brand-primary);
              color: white;
            }
            
            &:not(:last-child) {
              border-bottom: 1px solid var(--surface-divider);
            }
          }
        }
      }
      
      .text-input-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        position: relative;
        
        .text-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-primary);
          font-size: var(--font-size-base);
          font-family: var(--font-family-body);
          font-weight: var(--font-weight-medium);
          padding: var(--space-2) 0;
          
          @media screen and (max-width: 768px) {
            font-size: var(--font-size-base);
            padding: var(--space-2) 0;
          }
          
          &::placeholder {
            color: var(--text-tertiary);
            font-weight: var(--font-weight-normal);
          }
        }
        
        .emoji-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${props => props.theme.textTertiary};
          transition: all ${props => props.theme.transitionNormal};
          
          @media screen and (max-width: 768px) {
            width: 36px;
            height: 36px;
          }
          
          svg {
            font-size: 20px;
            width: 20px;
            height: 20px;
            
            @media screen and (max-width: 768px) {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
          
          &:hover {
            background: ${props => props.theme.type === 'dark' 
              ? `rgba(0, 255, 136, 0.1)`
              : `rgba(99, 102, 241, 0.1)`
            };
            color: ${props => props.theme.primary};
            transform: scale(1.05);
          }
            background: var(--brand-accent);
            color: white;
            transform: scale(1.1);
          }
          
          svg {
            font-size: 1.125rem;
            
            @media screen and (max-width: 768px) {
              font-size: 1rem;
            }
          }
        }
      }
      
      .send-btn, .voice-btn {
        width: 44px;
        height: 44px;
        border: none;
        background: ${props => props.theme.gradientPrimary};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: ${props => props.theme.type === 'dark' ? props.theme.textInverse : 'white'};
        transition: all ${props => props.theme.transitionNormal};
        box-shadow: ${props => props.theme.type === 'dark' 
          ? `0 4px 16px rgba(0, 255, 136, 0.3)`
          : `0 4px 16px rgba(99, 102, 241, 0.2)`
        };
        
        @media screen and (max-width: 768px) {
          width: 40px;
          height: 40px;
        }
        
        svg {
          font-size: 20px;
          width: 20px;
          height: 20px;
          
          @media screen and (max-width: 768px) {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
        
        &:hover {
          background: ${props => props.theme.gradientSecondary};
          transform: scale(1.05);
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 6px 20px rgba(0, 255, 136, 0.4)`
            : `0 6px 20px rgba(99, 102, 241, 0.3)`
          };
        }
        
        &:active {
          transform: scale(0.95);
        }
        
        &.recording {
          background: ${props => props.theme.gradientError};
          animation: pulse 1.5s infinite;
          
          @keyframes pulse {
            0% { 
              box-shadow: ${props => props.theme.type === 'dark' 
                ? `0 4px 16px rgba(0, 255, 136, 0.3), 0 0 0 0 rgba(255, 0, 64, 0.7)`
                : `0 4px 16px rgba(99, 102, 241, 0.2), 0 0 0 0 rgba(255, 107, 107, 0.7)`
              }; 
            }
            70% { 
              box-shadow: var(--elevation-3), 0 0 0 10px rgba(255, 107, 107, 0); 
            }
            100% { 
              box-shadow: var(--elevation-3), 0 0 0 0 rgba(255, 107, 107, 0); 
            }
          }
        }
      }

      .voice-control {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .recording-info {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(255, 0, 64, 0.1)`
            : `rgba(255, 107, 107, 0.1)`
          };
          border: 1px solid ${props => props.theme.type === 'dark' 
            ? `rgba(255, 0, 64, 0.3)`
            : `rgba(255, 107, 107, 0.3)`
          };
          border-radius: 20px;
          padding: 6px 12px;
          
          .recording-time {
            font-size: 14px;
            font-weight: 600;
            color: ${props => props.theme.type === 'dark' 
              ? `#ff0040`
              : `#ff6b6b`
            };
            font-family: monospace;
          }
          
          .cancel-btn {
            width: 20px;
            height: 20px;
            border: none;
            background: ${props => props.theme.type === 'dark' 
              ? `rgba(255, 0, 64, 0.2)`
              : `rgba(255, 107, 107, 0.2)`
            };
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: ${props => props.theme.type === 'dark' 
              ? `#ff0040`
              : `#ff6b6b`
            };
            font-size: 16px;
            font-weight: bold;
            transition: all ${props => props.theme.transitionNormal};
            
            &:hover {
              background: ${props => props.theme.type === 'dark' 
                ? `rgba(255, 0, 64, 0.3)`
                : `rgba(255, 107, 107, 0.3)`
              };
              transform: scale(1.1);
            }
          }
        }
      }
    }
    
    .emoji-picker-container {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--elevation-6);
      margin-bottom: var(--space-2);
      overflow: hidden;
      z-index: var(--z-modal);
      
      @media screen and (max-width: 768px) {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        max-height: 60vh;
        backdrop-filter: blur(20px);
      }
      
      .emoji-picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--surface-divider);
        background: var(--bg-secondary);
        
        span {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }
        
        .close-button {
          width: 1.75rem;
          height: 1.75rem;
          border: none;
          background: var(--surface-variant);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all var(--duration-normal) var(--ease-spring);
          font-size: 1.25rem;
          font-weight: var(--font-weight-bold);
          
          &:hover {
            background: var(--brand-primary);
            color: white;
            transform: scale(1.1);
          }
        }
      }
    }
  }
`;
