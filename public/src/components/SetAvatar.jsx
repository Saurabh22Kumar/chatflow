import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import loader from "../assets/loader.gif";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { setAvatarRoute } from "../utils/APIRoutes";
import multiavatar from "@multiavatar/multiavatar/esm";
import { FiUser, FiRefreshCw, FiCheck, FiArrowLeft } from "react-icons/fi";

export default function SetAvatar() {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSetting, setIsSetting] = useState(false);

  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(() => {
    const user = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
    if (!user) navigate("/login");
  }, [navigate]);

  const generateRandomName = () => Math.random().toString(36).substring(2, 10);

  const generateNewAvatars = useCallback(async () => {
    setIsGenerating(true);
    const data = [];
    for (let i = 0; i < 4; i++) {
      const randomName = generateRandomName();
      const svgCode = multiavatar(randomName);
      const encoded = btoa(unescape(encodeURIComponent(svgCode)));
      data.push(encoded);
    }
    setAvatars(data);
    setSelectedAvatar(undefined);
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    const generateAvatars = async () => {
      await generateNewAvatars();
      setIsLoading(false);
    };

    generateAvatars();
  }, [generateNewAvatars]);

  const setProfilePicture = async () => {
    if (selectedAvatar === undefined) {
      toast.error("Please select an avatar", toastOptions);
      return;
    }

    setIsSetting(true);
    try {
      const user = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );

      const { data } = await axios.post(`${setAvatarRoute}/${user._id}`, {
        image: avatars[selectedAvatar],
      });

      if (data.isSet) {
        user.isAvatarImageSet = true;
        user.avatarImage = data.image;
        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(user)
        );
        navigate("/");
      } else {
        toast.error("Error setting avatar. Please try again.", toastOptions);
      }
    } catch (error) {
      toast.error("Error setting avatar. Please try again.", toastOptions);
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Container>
          <div className="loading-container">
            <div className="loader-wrapper">
              <img src={loader} alt="loader" className="loader" />
              <p>Generating awesome avatars...</p>
            </div>
          </div>
        </Container>
      ) : (
        <Container>
          <div className="floating-icon">
            <FiUser />
          </div>
          
          <div className="content">
            <div className="header">
              <button className="back-btn" onClick={() => navigate(-1)}>
                <FiArrowLeft />
              </button>
              <div className="title-container">
                <h1>Choose Your Avatar</h1>
                <p>Pick a profile picture that represents you</p>
              </div>
            </div>
            
            <div className="avatar-section">
              <div className="avatars">
                {avatars.map((avatar, index) => (
                  <div
                    key={index}
                    className={`avatar ${
                      selectedAvatar === index ? "selected" : ""
                    }`}
                    onClick={() => setSelectedAvatar(index)}
                  >
                    <img
                      src={`data:image/svg+xml;base64,${avatar}`}
                      alt={`avatar-${index}`}
                    />
                    {selectedAvatar === index && (
                      <div className="selected-overlay">
                        <FiCheck />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button 
                className="refresh-btn" 
                onClick={generateNewAvatars}
                disabled={isGenerating}
              >
                <FiRefreshCw className={isGenerating ? 'spinning' : ''} />
                {isGenerating ? 'Generating...' : 'Generate New'}
              </button>
            </div>
            
            <button 
              onClick={setProfilePicture} 
              className="submit-btn"
              disabled={selectedAvatar === undefined || isSetting}
            >
              {isSetting ? (
                <>
                  <div className="loading-spinner"></div>
                  Setting Avatar...
                </>
              ) : (
                <>
                  <FiCheck />
                  Set as Profile Picture
                </>
              )}
            </button>
          </div>
          
          <ToastContainer />
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  /* World-Class Avatar Selection Design */
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: var(--gradient-cool);
  padding: var(--space-4);
  position: relative;
  overflow: hidden;

  /* Animated background elements */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.05) 0%, transparent 50%);
    animation: float 15s ease-in-out infinite;
    z-index: 0;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }

  /* Floating icon */
  .floating-icon {
    position: absolute;
    top: 8%;
    left: 50%;
    transform: translateX(-50%);
    width: 4rem;
    height: 4rem;
    background: var(--gradient-primary);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--elevation-5);
    z-index: 2;
    animation: logoFloat 6s ease-in-out infinite;
    
    svg {
      font-size: 1.5rem;
      color: white;
    }
    
    @keyframes logoFloat {
      0%, 100% { transform: translateX(-50%) translateY(0px); }
      50% { transform: translateX(-50%) translateY(-10px); }
    }
    
    @media (max-width: 768px) {
      top: 6%;
      width: 3rem;
      height: 3rem;
      
      svg {
        font-size: 1.25rem;
      }
    }
  }

  /* Loading state */
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    z-index: 1;
    
    .loader-wrapper {
      text-align: center;
      background: var(--bg-glass);
      backdrop-filter: var(--glass-backdrop);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      box-shadow: var(--elevation-6);
      
      .loader {
        max-width: 4rem;
        height: auto;
        margin-bottom: var(--space-4);
      }
      
      p {
        color: var(--text-primary);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-medium);
        margin: 0;
      }
    }
  }

  /* Main content */
  .content {
    background: var(--bg-glass);
    backdrop-filter: var(--glass-backdrop);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    box-shadow: var(--elevation-6);
    width: 100%;
    max-width: 600px;
    position: relative;
    z-index: 1;
    
    @media (max-width: 768px) {
      padding: var(--space-6);
      margin: var(--space-4);
      max-width: 100%;
    }
  }

  .header {
    text-align: center;
    margin-bottom: var(--space-8);
    position: relative;
    
    .back-btn {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      background: var(--surface-variant);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all var(--duration-normal) var(--ease-spring);
      
      svg {
        font-size: 1.125rem;
      }
      
      &:hover {
        background: var(--brand-primary);
        color: white;
        transform: translateY(-50%) scale(1.05);
      }
      
      @media (max-width: 768px) {
        position: static;
        transform: none;
        margin-bottom: var(--space-4);
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }
    
    .title-container {
      h1 {
        color: var(--text-primary);
        font-family: var(--font-family-display);
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--space-2) 0;
        background: var(--gradient-primary);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        
        @supports not (background-clip: text) {
          color: var(--brand-primary);
        }
        
        @media (max-width: 768px) {
          font-size: var(--font-size-2xl);
        }
      }
      
      p {
        color: var(--text-secondary);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-medium);
        margin: 0;
      }
    }
  }

  .avatar-section {
    margin-bottom: var(--space-8);
    
    .avatars {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-6);
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }

      .avatar {
        position: relative;
        border: 3px solid transparent;
        padding: var(--space-2);
        border-radius: var(--radius-2xl);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-spring);
        background: var(--surface-elevated);
        box-shadow: var(--elevation-2);
        
        &:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: var(--elevation-4);
          border-color: var(--brand-secondary);
        }

        img {
          width: 5rem;
          height: 5rem;
          border-radius: var(--radius-xl);
          transition: all var(--duration-normal) var(--ease-out);
          
          @media (max-width: 768px) {
            width: 4rem;
            height: 4rem;
          }
        }
        
        .selected-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 2rem;
          height: 2rem;
          background: var(--brand-primary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: checkmark 0.3s var(--ease-bounce);
          
          svg {
            color: white;
            font-size: 1rem;
          }
          
          @keyframes checkmark {
            0% { transform: translate(-50%, -50%) scale(0); }
            100% { transform: translate(-50%, -50%) scale(1); }
          }
        }

        &.selected {
          border-color: var(--brand-primary);
          background: var(--bg-primary);
          transform: scale(1.05);
          box-shadow: var(--elevation-5), 0 0 0 3px rgba(99, 102, 241, 0.2);
          
          img {
            opacity: 0.7;
          }
        }
      }
    }
    
    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      background: var(--surface-elevated);
      border: 2px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-normal) var(--ease-out);
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-sm);
      width: 100%;
      
      svg {
        font-size: 1rem;
        
        &.spinning {
          animation: spin 1s linear infinite;
        }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      &:hover:not(:disabled) {
        background: var(--brand-secondary);
        color: white;
        border-color: var(--brand-secondary);
        transform: translateY(-1px);
        box-shadow: var(--elevation-3);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .submit-btn {
    background: var(--gradient-primary);
    color: white;
    padding: var(--space-4) var(--space-6);
    border: none;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-lg);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all var(--duration-normal) var(--ease-spring);
    position: relative;
    overflow: hidden;
    box-shadow: var(--elevation-4);
    width: 100%;
    min-height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    
    /* Shine effect */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left var(--duration-slow) var(--ease-out);
    }
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--elevation-5);
      
      &::before {
        left: 100%;
      }
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    
    .loading-spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: var(--radius-full);
      animation: spin 1s linear infinite;
    }
    
    svg {
      font-size: 1.125rem;
    }
  }
`;
