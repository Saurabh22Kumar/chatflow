import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginRoute } from "../utils/APIRoutes";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import ForgotPassword from "../components/ForgotPassword";

export default function Login() {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [values, setValues] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };
  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const validateForm = () => {
    const { username, password } = values;
    if (username === "") {
      toast.error("Email and Password is required.", toastOptions);
      return false;
    } else if (password === "") {
      toast.error("Email and Password is required.", toastOptions);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      try {
        const { username, password } = values;
        const { data } = await axios.post(loginRoute, {
          username,
          password,
        });
        
        if (!isMountedRef.current) return;
        
        if (data.status === false) {
          toast.error(data.msg, toastOptions);
        }
        if (data.status === true) {
          localStorage.setItem(
            process.env.REACT_APP_LOCALHOST_KEY,
            JSON.stringify(data.user)
          );
          navigate("/");
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        toast.error("Login failed. Please try again.", toastOptions);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <>
      {showForgotPassword ? (
        <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
      ) : (
        <FormContainer className={isLoading ? 'loading-state' : ''}>
          <form action="" onSubmit={(event) => handleSubmit(event)}>
            <div className="brand">
              <div className="logo-container"></div>
              <h1>ChatFlow</h1>
              <p className="subtitle">Connect, Chat, Flow</p>
            </div>
            
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Username or Email"
                name="username"
                value={values.username}
                onChange={(e) => handleChange(e)}
                min="3"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={values.password}
                onChange={(e) => handleChange(e)}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            
            <div className="forgot-password-link">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="link-button"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>
            
            <div className="auth-link">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
          </form>
        </FormContainer>
      )}
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: ${props => props.theme.type === 'dark' 
    ? `linear-gradient(135deg, 
        #0A0A0A 0%, 
        #1A1A1A 25%, 
        #0F1419 50%, 
        #1A2332 75%, 
        #2A2A2A 100%)`
    : `linear-gradient(135deg, 
        #667eea 0%, 
        #764ba2 25%, 
        #6366F1 50%, 
        #8B5CF6 75%, 
        #A855F7 100%)`
  };
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  position: relative;
  overflow: hidden;
  transition: all ${props => props.theme.transitionNormal};
  
  /* Animated background elements */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: ${props => props.theme.type === 'dark' 
      ? `radial-gradient(circle at 20% 80%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
         radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
         radial-gradient(circle at 40% 40%, rgba(255, 0, 128, 0.1) 0%, transparent 50%)`
      : `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
         radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
         radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)`
    };
    animation: float 20s ease-in-out infinite;
  }
  
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-30px) rotate(0.5deg); }
    66% { transform: translateY(15px) rotate(-0.5deg); }
  }

  .brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-8);
    position: relative;
    z-index: 2;
    
    .logo-container {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
      border-radius: var(--radius-2xl);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
      margin-bottom: var(--space-3);
      animation: logoFloat 6s ease-in-out infinite;
      
      &::before {
        content: '💬';
        font-size: 2rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
    }
    
    @keyframes logoFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    h1 {
      color: white;
      font-size: clamp(2.5rem, 6vw, 3.5rem);
      font-weight: var(--font-weight-bold);
      text-align: center;
      background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      letter-spacing: -0.02em;
      margin: 0;
      position: relative;
    }
    
    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-medium);
      text-align: center;
      margin-top: var(--space-2);
      letter-spacing: 0.5px;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    background: rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-2xl);
    padding: var(--space-12) var(--space-8);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 32px 64px rgba(0, 0, 0, 0.15),
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 2;
    animation: slideUp 0.6s ease-out;
    
    /* Glassmorphism border glow */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.1) 0%, 
        rgba(255, 255, 255, 0.05) 50%, 
        rgba(255, 255, 255, 0.1) 100%);
      border-radius: inherit;
      z-index: -1;
      opacity: 0;
      transition: opacity var(--duration-normal) var(--ease-out);
    }
    
    &:hover::before {
      opacity: 1;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media screen and (max-width: 480px) {
      padding: var(--space-8) var(--space-6);
      max-width: 100%;
      margin: 0 var(--space-4);
    }
  }
  
  .input-group {
    position: relative;
    width: 100%;
    
    .input-icon {
      position: absolute;
      left: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.6);
      font-size: var(--font-size-lg);
      z-index: 2;
      transition: all var(--duration-normal) var(--ease-out);
    }
    
    .password-toggle {
      position: absolute;
      right: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: var(--font-size-lg);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-base);
      transition: all var(--duration-normal) var(--ease-out);
      z-index: 2;
      
      &:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
      }
      
      &:active {
        transform: translateY(-50%) scale(0.95);
      }
    }
    
    input {
      width: 100%;
      background: rgba(255, 255, 255, 0.06);
      padding: var(--space-4) var(--space-4) var(--space-4) var(--space-12);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-xl);
      color: white;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      transition: all var(--duration-normal) var(--ease-out);
      position: relative;
      backdrop-filter: blur(10px);
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
        font-weight: var(--font-weight-normal);
      }
      
      &:focus {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 
          0 0 0 3px rgba(255, 255, 255, 0.1),
          0 8px 25px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
        
        ~ .input-icon {
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-50%) scale(1.1);
        }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.1) inset;
        -webkit-text-fill-color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
    }
  }

  .submit-button {
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    color: white;
    padding: var(--space-5) var(--space-8);
    border: none;
    font-weight: var(--font-weight-semibold);
    border-radius: var(--radius-xl);
    font-size: var(--font-size-lg);
    letter-spacing: 0.5px;
    transition: all var(--duration-normal) var(--ease-out);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 4px 15px rgba(99, 102, 241, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    
    /* Shimmer effect */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.3) 50%, 
        transparent 100%);
      transition: left var(--duration-slow) var(--ease-out);
    }
    
    /* Ripple effect */
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: width 0.3s ease-out, height 0.3s ease-out;
    }
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 25px rgba(99, 102, 241, 0.5),
        0 4px 15px rgba(0, 0, 0, 0.2);
      background: linear-gradient(135deg, #5855F0 0%, #7C3AED 100%);
      
      &::before {
        left: 100%;
      }
    }
    
    &:active:not(:disabled) {
      transform: translateY(-1px);
      
      &::after {
        width: 300px;
        height: 300px;
      }
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      
      &:hover {
        transform: none;
        box-shadow: 
          0 4px 15px rgba(99, 102, 241, 0.4),
          0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
    
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
  
  .auth-link {
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    
    a {
      color: #E0E7FF;
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
      transition: all var(--duration-normal) var(--ease-out);
      position: relative;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      
      &::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #E0E7FF, #C7D2FE);
        transition: width var(--duration-normal) var(--ease-out);
      }
      
      &:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        
        &::before {
          width: 100%;
        }
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
  }
  
  .forgot-password-link {
    text-align: center;
    margin: 0.5rem 0;
    
    .link-button {
      background: none;
      border: none;
      color: #a78bfa;
      cursor: pointer;
      font-size: 0.9rem;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        color: white;
        text-decoration: underline;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
  
  &.loading-state {
    pointer-events: none;
    
    .submit-button {
      background: rgba(255, 255, 255, 0.2);
      cursor: not-allowed;
    }
    
    input {
      pointer-events: none;
    }
  }
`;
