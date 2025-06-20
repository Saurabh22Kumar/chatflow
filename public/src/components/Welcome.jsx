import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Robot from "../assets/robot.gif";
import { FiMessageCircle, FiHeart, FiSmile, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Welcome({ hasFriends = true }) {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const userData = await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );
        
        if (userData && userData.username) {
          setUserName(userData.username);
        } else {
          // If no user data, redirect to login
          console.log('No user data found, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        navigate('/login');
      }
    };
    
    loadUsername();
  }, [navigate]);
  return (
    <Container>
      <div className="welcome-content">
        <div className="robot-container">
          <img src={Robot} alt="Welcome Robot" />
          <div className="pulse-ring"></div>
          <div className="glow-effect"></div>
        </div>
        <div className="text-content">
          <h1>
            Welcome back, <span className="username">{userName}!</span>
          </h1>
          {hasFriends ? (
            <h3>Select a conversation to start chatting</h3>
          ) : (
            <h3>Add friends to start chatting!</h3>
          )}
          <div className="features">
            {hasFriends ? (
              <>
                <div className="feature">
                  <div className="feature-icon">
                    <FiMessageCircle />
                  </div>
                  <span>Real-time messaging</span>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <FiHeart />
                  </div>
                  <span>Connect with friends</span>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <FiSmile />
                  </div>
                  <span>Emoji & reactions</span>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <FiUsers />
                  </div>
                  <span>Group conversations</span>
                </div>
              </>
            ) : (
              <>
                <div className="feature">
                  <div className="feature-icon">
                    <FiUsers />
                  </div>
                  <span>Search for users to add as friends</span>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <FiMessageCircle />
                  </div>
                  <span>Send friend requests</span>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <FiHeart />
                  </div>
                  <span>Build your friend network</span>
                </div>
                <div className="feature">
                  <div className="feature-icon">
                    <FiSmile />
                  </div>
                  <span>Start meaningful conversations</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

const Container = styled.div`
  /* World-Class Welcome Screen Design */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: var(--bg-primary);
  padding: var(--space-8);
  position: relative;
  overflow: hidden;
  
  /* Animated background pattern */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 50%);
    animation: backgroundFloat 20s ease-in-out infinite;
    z-index: 0;
  }
  
  @keyframes backgroundFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(1deg); }
    66% { transform: translateY(10px) rotate(-1deg); }
  }
  
  .welcome-content {
    text-align: center;
    max-width: 600px;
    position: relative;
    z-index: 1;
    
    .robot-container {
      position: relative;
      display: inline-block;
      margin-bottom: var(--space-8);
      
      img {
        height: 12rem;
        width: 12rem;
        object-fit: contain;
        border-radius: var(--radius-full);
        background: var(--gradient-primary);
        padding: var(--space-5);
        box-shadow: var(--elevation-6);
        animation: float 6s ease-in-out infinite;
        transition: all var(--duration-normal) var(--ease-out);
        
        @media screen and (max-width: 768px) {
          height: 10rem;
          width: 10rem;
          padding: var(--space-4);
        }
      }
      
      .pulse-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 15rem;
        height: 15rem;
        border: 2px solid var(--brand-primary);
        border-radius: var(--radius-full);
        opacity: 0;
        animation: pulse 3s infinite;
        
        @media screen and (max-width: 768px) {
          width: 12rem;
          height: 12rem;
        }
      }
      
      .glow-effect {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 13rem;
        height: 13rem;
        background: var(--gradient-primary);
        border-radius: var(--radius-full);
        opacity: 0.1;
        filter: blur(20px);
        animation: glow 4s ease-in-out infinite alternate;
        
        @media screen and (max-width: 768px) {
          width: 11rem;
          height: 11rem;
        }
      }
    }
    
    .text-content {
      h1 {
        color: var(--text-primary);
        font-family: var(--font-family-display);
        font-size: var(--font-size-4xl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--space-4) 0;
        line-height: var(--line-height-tight);
        
        .username {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          
          @supports not (background-clip: text) {
            color: var(--brand-primary);
          }
        }
        
        @media screen and (max-width: 768px) {
          font-size: var(--font-size-3xl);
        }
      }
      
      h3 {
        color: var(--text-secondary);
        font-family: var(--font-family-body);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-medium);
        margin: 0 0 var(--space-8) 0;
        opacity: 0.9;
        
        @media screen and (max-width: 768px) {
          font-size: var(--font-size-base);
        }
      }
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: var(--space-6);
      margin-top: var(--space-8);
      
      @media screen and (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
      }
      
      .feature {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-5);
        background: var(--surface-elevated);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-xl);
        transition: all var(--duration-normal) var(--ease-spring);
        box-shadow: var(--elevation-1);
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: var(--elevation-4);
          border-color: var(--brand-primary);
          
          .feature-icon {
            background: var(--gradient-primary);
            color: white;
            transform: scale(1.1);
          }
        }
        
        .feature-icon {
          width: 3rem;
          height: 3rem;
          border-radius: var(--radius-full);
          background: var(--surface-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all var(--duration-normal) var(--ease-spring);
          
          svg {
            font-size: 1.25rem;
          }
        }
        
        span {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          text-align: center;
        }
      }
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes pulse {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.3);
    }
  }
  
  @keyframes glow {
    0% {
      opacity: 0.1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0.2;
      transform: translate(-50%, -50%) scale(1.1);
    }
  }
`;
