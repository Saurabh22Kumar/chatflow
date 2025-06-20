import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerRoute, checkUsernameRoute } from "../utils/APIRoutes";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiCheck, FiX } from "react-icons/fi";
import OTPVerification from "../components/OTPVerification";

export default function Register() {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  
  // Username availability checking
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: ""
  });
  const usernameCheckTimeoutRef = useRef(null);
  const currentUsernameRequestRef = useRef(null);

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
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      if (currentUsernameRequestRef.current) {
        currentUsernameRequestRef.current.cancel();
      }
    };
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues({ ...values, [name]: value });
    
    // Check username availability with debouncing
    if (name === "username") {
      // Clear previous timeout and cancel any ongoing request
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
        usernameCheckTimeoutRef.current = null;
      }
      
      if (currentUsernameRequestRef.current) {
        currentUsernameRequestRef.current.cancel();
        currentUsernameRequestRef.current = null;
      }
      
      // Reset status immediately
      setUsernameStatus({
        checking: false,
        available: null,
        message: ""
      });
      
      // Don't check if component is unmounted or value is too short
      if (!isMountedRef.current || value.length < 3) {
        return;
      }
      
      // Basic validation first
      if (value.length > 20) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: "Username must be less than 20 characters"
        });
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        setUsernameStatus({
          checking: false,
          available: false,
          message: "Username can only contain letters, numbers, and underscores"
        });
        return;
      }
      
      // Set checking state immediately before timeout
      setUsernameStatus({
        checking: true,
        available: null,
        message: "Checking availability..."
      });
      
      // Create new timeout for checking (500ms debounce)
      usernameCheckTimeoutRef.current = setTimeout(async () => {
        try {
          // Double-check if component is still mounted and this is still the latest request
          if (!isMountedRef.current) return;
          
          // Create cancellable request
          const source = axios.CancelToken.source();
          currentUsernameRequestRef.current = source;
          
          const response = await axios.get(`${checkUsernameRoute}/${value}`, {
            timeout: 8000, // 8 second timeout
            cancelToken: source.token
          });
          
          // Clear the request reference since it completed successfully
          currentUsernameRequestRef.current = null;
          
          // Only update state if component is still mounted and this request wasn't cancelled
          if (!isMountedRef.current) return;
          
          setUsernameStatus({
            checking: false,
            available: response.data.available,
            message: response.data.msg
          });
          
        } catch (error) {
          // Clear the request reference
          currentUsernameRequestRef.current = null;
          
          // Don't update state if component is unmounted or request was cancelled
          if (!isMountedRef.current || axios.isCancel(error)) return;
          
          console.error('Username check error:', error);
          
          let errorMessage = "Error checking username availability";
          if (error.code === 'ECONNABORTED') {
            errorMessage = "Request timed out. Please try again.";
          } else if (error.response?.status >= 500) {
            errorMessage = "Server error. Please try again.";
          } else if (!navigator.onLine) {
            errorMessage = "No internet connection";
          }
          
          setUsernameStatus({
            checking: false,
            available: null,
            message: errorMessage
          });
        }
      }, 500); // 500ms debounce for better UX
    }
  };

  const handleValidation = () => {
    const { password, confirmPassword, username, email } = values;
    
    if (username.length < 3) {
      toast.error(
        "Username should be greater than 3 characters.",
        toastOptions
      );
      return false;
    } else if (username.length > 20) {
      toast.error(
        "Username should be less than 20 characters.",
        toastOptions
      );
      return false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error(
        "Username can only contain letters, numbers, and underscores.",
        toastOptions
      );
      return false;
    } else if (usernameStatus.available === false) {
      toast.error(
        usernameStatus.message || "Username is not available.",
        toastOptions
      );
      return false;
    } else if (usernameStatus.checking) {
      toast.error(
        "Please wait while we check username availability.",
        toastOptions
      );
      return false;
    } else if (email === "") {
      toast.error("Email is required.", toastOptions);
      return false;
    } else if (password.length < 8) {
      toast.error(
        "Password should be equal or greater than 8 characters.",
        toastOptions
      );
      return false;
    } else if (password !== confirmPassword) {
      toast.error(
        "Password and confirm password should be same.",
        toastOptions
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (handleValidation()) {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      try {
        const { email, username, password } = values;
        const { data } = await axios.post(registerRoute, {
          username,
          email,
          password,
        });

        if (!isMountedRef.current) return;

        if (data.status === false) {
          toast.error(data.msg, toastOptions);
        } else if (data.status === true && data.requiresOTP) {
          // Registration successful, now show OTP verification
          setRegistrationEmail(data.email);
          setShowOTPVerification(true);
          toast.success(data.msg, toastOptions);
        } else if (data.status === true && data.user) {
          // Old flow fallback (shouldn't happen with new implementation)
          localStorage.setItem(
            process.env.REACT_APP_LOCALHOST_KEY,
            JSON.stringify(data.user)
          );
          navigate("/");
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error("Registration error:", error);
        toast.error("Registration failed. Please try again.", toastOptions);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
  };

  const handleOTPVerificationSuccess = (user) => {
    localStorage.setItem(
      process.env.REACT_APP_LOCALHOST_KEY,
      JSON.stringify(user)
    );
    navigate("/");
  };

  const handleBackToRegister = () => {
    // Clear any ongoing username check
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
      usernameCheckTimeoutRef.current = null;
    }
    if (currentUsernameRequestRef.current) {
      currentUsernameRequestRef.current.cancel();
      currentUsernameRequestRef.current = null;
    }
    
    setShowOTPVerification(false);
    setRegistrationEmail("");
    // Clear form
    setValues({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setUsernameStatus({
      checking: false,
      available: null,
      message: ""
    });
  };

  return (
    <>
      {showOTPVerification ? (
        <OTPVerification
          email={registrationEmail}
          onVerificationSuccess={handleOTPVerificationSuccess}
          onBackToRegister={handleBackToRegister}
        />
      ) : (
        <FormContainer>
          <div className="floating-logo">
            <FiUserPlus />
          </div>
          
          <form action="" onSubmit={(event) => handleSubmit(event)}>
            <div className="brand">
              <h1>ChatFlow</h1>
              <p>Create your account</p>
            </div>
          
          <div className="input-group">
            <div className="input-icon">
              <FiUser />
            </div>
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={values.username}
              onChange={(e) => handleChange(e)}
              autoComplete="username"
              disabled={isLoading}
              className={usernameStatus.available === true ? 'valid' : usernameStatus.available === false ? 'invalid' : ''}
            />
            {/* Username Status Indicator */}
            <div className="input-status">
              {usernameStatus.checking && (
                <div className="status-indicator checking">
                  <div className="spinner"></div>
                </div>
              )}
              {usernameStatus.available === true && (
                <div className="status-indicator valid">
                  <FiCheck />
                </div>
              )}
              {usernameStatus.available === false && (
                <div className="status-indicator invalid">
                  <FiX />
                </div>
              )}
            </div>
            {usernameStatus.message && values.username.length >= 3 && (
              <div className={`status-message ${
                usernameStatus.available === true ? 'valid' : 
                usernameStatus.available === false ? 'invalid' : 
                'neutral'
              }`}>
                {usernameStatus.message}
              </div>
            )}
          </div>
          
          <div className="input-group">
            <div className="input-icon">
              <FiMail />
            </div>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={values.email}
              onChange={(e) => handleChange(e)}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          
          <div className="input-group">
            <div className="input-icon">
              <FiLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              value={values.password}
              onChange={(e) => handleChange(e)}
              autoComplete="new-password"
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
          
          <div className="input-group">
            <div className="input-icon">
              <FiLock />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={(e) => handleChange(e)}
              autoComplete="new-password"
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          
          <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
          
          <div className="auth-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </form>
      </FormContainer>
      )}
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  /* World-Class Register Screen Design */
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--gradient-aurora);
  padding: var(--space-4);
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
      radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%);
    animation: float 20s ease-in-out infinite;
    z-index: 0;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(1deg); }
    66% { transform: translateY(10px) rotate(-1deg); }
  }
  
  /* Floating logo */
  .floating-logo {
    position: absolute;
    top: 10%;
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
      top: 8%;
      width: 3rem;
      height: 3rem;
      
      svg {
        font-size: 1.25rem;
      }
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    background: var(--bg-glass);
    backdrop-filter: var(--glass-backdrop);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    box-shadow: var(--elevation-6);
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    transition: all var(--duration-normal) var(--ease-spring);
    
    /* Glassmorphism glow */
    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: var(--gradient-primary);
      border-radius: inherit;
      z-index: -1;
      opacity: 0.1;
      filter: blur(10px);
    }
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--elevation-6), 0 0 40px rgba(99, 102, 241, 0.15);
    }
    
    @media (max-width: 768px) {
      padding: var(--space-6);
      margin: var(--space-4);
      max-width: 100%;
    }
  }
  
  .brand {
    text-align: center;
    margin-bottom: var(--space-6);
    
    h1 {
      color: var(--text-primary);
      font-family: var(--font-family-display);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      background: var(--gradient-primary);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-2);
      
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
    }
  }
  
  .input-group {
    position: relative;
    
    .input-icon {
      position: absolute;
      left: var(--space-4);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      z-index: 2;
      transition: all var(--duration-fast) var(--ease-out);
      
      svg {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
    
    &:focus-within .input-icon {
      color: var(--brand-primary);
      transform: translateY(-50%) scale(1.1);
    }
  }
  
  input {
    background: var(--surface-elevated);
    padding: var(--space-4) var(--space-4) var(--space-4) var(--space-12);
    border: 2px solid var(--surface-border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    width: 100%;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--duration-normal) var(--ease-out);
    box-shadow: var(--elevation-1);
    
    &:focus {
      border-color: var(--brand-primary);
      box-shadow: var(--elevation-3), 0 0 0 3px rgba(99, 102, 241, 0.1);
      transform: translateY(-1px);
      outline: none;
      background: var(--bg-primary);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
      font-weight: var(--font-weight-normal);
    }
    
    &:hover:not(:focus) {
      border-color: var(--brand-secondary);
      box-shadow: var(--elevation-2);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &.valid {
      border-color: var(--success);
      background: rgba(34, 197, 94, 0.05);
    }
    
    &.invalid {
      border-color: var(--error);
      background: rgba(239, 68, 68, 0.05);
    }
  }
  
  .input-status {
    position: absolute;
    right: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--radius-full);
      
      &.checking {
        background: var(--bg-secondary);
        
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid var(--text-tertiary);
          border-top: 2px solid var(--brand-primary);
          border-radius: var(--radius-full);
          animation: spin 0.8s linear infinite;
        }
      }
      
      &.valid {
        background: var(--success);
        color: white;
        
        svg {
          width: 0.875rem;
          height: 0.875rem;
        }
      }
      
      &.invalid {
        background: var(--error);
        color: white;
        
        svg {
          width: 0.875rem;
          height: 0.875rem;
        }
      }
    }
  }
  
  .status-message {
    position: absolute;
    top: 100%;
    left: 0;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    
    &.valid {
      color: var(--success);
    }
    
    &.invalid {
      color: var(--error);
    }
    
    &.neutral {
      color: var(--text-secondary);
    }
    right: 0;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    margin-top: var(--space-1);
    padding: 0 var(--space-2);
    
    &.valid {
      color: var(--success);
    }
    
    &.invalid {
      color: var(--error);
    }
  }
  
  .password-toggle {
    position: absolute;
    right: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-base);
    transition: all var(--duration-fast) var(--ease-out);
    
    &:hover {
      color: var(--brand-primary);
      background: var(--surface-variant);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
  
  button[type="submit"] {
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
    margin-top: var(--space-2);
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
    
    &.loading {
      pointer-events: none;
    }
    
    .loading-spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: var(--radius-full);
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
  
  .auth-link {
    color: var(--text-secondary);
    text-align: center;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    margin-top: var(--space-2);
    
    a {
      color: var(--brand-primary);
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
      transition: all var(--duration-fast) var(--ease-out);
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        width: 0;
        height: 2px;
        bottom: -2px;
        left: 0;
        background: var(--gradient-primary);
        transition: width var(--duration-normal) var(--ease-out);
      }
      
      &:hover {
        color: var(--brand-primary-light);
        
        &::after {
          width: 100%;
        }
      }
    }
  }
`;
