import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { verifyOTPRoute, resendOTPRoute } from "../utils/APIRoutes";
import styled from "styled-components";
import { toast } from "react-toastify";

export default function OTPVerification({ email, onVerificationSuccess, onBackToRegister }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const inputRefs = useRef([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setResendCooldown(resendCooldown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleVerifyOTP();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await axios.post(verifyOTPRoute, {
        email,
        otp: otpCode,
      });

      if (!isMountedRef.current) return;

      if (response.data.status) {
        toast.success(response.data.msg || "Account created successfully!");
        onVerificationSuccess(response.data.user);
      } else {
        if (response.data.expired) {
          toast.error("Verification code has expired. Please request a new one.");
        } else if (response.data.maxAttemptsExceeded) {
          toast.error("Maximum attempts exceeded. Please start over.");
          onBackToRegister();
        } else {
          toast.error(response.data.msg);
          if (response.data.remainingAttempts !== undefined) {
            setRemainingAttempts(response.data.remainingAttempts);
          }
        }
        // Clear OTP inputs on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error("OTP verification error:", error);
        toast.error("Verification failed. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);

    try {
      const response = await axios.post(resendOTPRoute, { email });

      if (!isMountedRef.current) return;

      if (response.data.status) {
        toast.success("New verification code sent!");
        setResendCooldown(60);
        setRemainingAttempts(5);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        if (response.data.waitTime) {
          setResendCooldown(response.data.waitTime);
        }
        toast.error(response.data.msg);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error("Resend OTP error:", error);
        toast.error("Failed to resend code. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Container>
      <FormContainer>
        <div className="brand">
          <img src="/logo192.png" alt="Logo" />
          <h1>ChatFlow</h1>
        </div>
        
        <div className="verify-section">
          <h2>Verify Your Email</h2>
          <p className="email-text">We've sent a 6-digit code to:</p>
          <p className="email-highlight">{email}</p>
          
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="otp-input"
                disabled={isLoading}
              />
            ))}
          </div>

          {remainingAttempts < 5 && (
            <p className="attempts-warning">
              {remainingAttempts} attempts remaining
            </p>
          )}

          <button
            type="button"
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.join("").length !== 6}
            className="verify-btn"
          >
            {isLoading ? "Verifying..." : "Verify & Create Account"}
          </button>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || isLoading}
              className="resend-btn"
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : "Resend Code"
              }
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToRegister}
            className="back-btn"
            disabled={isLoading}
          >
            ← Back to Registration
          </button>
        </div>
      </FormContainer>
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const FormContainer = styled.div`
  background-color: #00000076;
  border-radius: 2rem;
  padding: 3rem 5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 90%;
  max-width: 500px;
  box-sizing: border-box;

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    
    img {
      height: 3rem;
    }
    
    h1 {
      color: white;
      text-transform: uppercase;
      font-size: 1.8rem;
      font-weight: bold;
    }
  }

  .verify-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;

    h2 {
      color: white;
      font-size: 1.5rem;
      text-align: center;
      margin: 0;
    }

    .email-text {
      color: #b3b3b3;
      margin: 0;
      text-align: center;
    }

    .email-highlight {
      color: #4e0eff;
      font-weight: bold;
      margin: 0;
      text-align: center;
      word-break: break-all;
    }
  }

  .otp-container {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    align-items: center;
    margin: 1rem 0;

    .otp-input {
      width: 3.5rem;
      height: 3.5rem;
      text-align: center;
      font-size: 1.4rem;
      font-weight: bold;
      border: 2px solid #4e0eff;
      border-radius: 0.4rem;
      background-color: transparent;
      color: white;
      transition: all 0.3s ease;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;

      &:focus {
        border-color: #997af0;
        outline: none;
        box-shadow: 0 0 0 3px rgba(78, 14, 255, 0.1);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Ensure text is centered and visible */
      &::-webkit-input-placeholder {
        color: #666;
        opacity: 0.7;
      }
      
      &::-moz-placeholder {
        color: #666;
        opacity: 0.7;
      }
    }
  }

  .attempts-warning {
    color: #ff6b6b;
    margin: 0;
    font-size: 0.9rem;
    text-align: center;
  }

  .verify-btn {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    transition: all 0.3s ease;
    width: 100%;

    &:hover:not(:disabled) {
      background-color: #997af0;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .resend-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;

    p {
      color: #b3b3b3;
      margin: 0;
      font-size: 0.9rem;
    }

    .resend-btn {
      background: none;
      border: none;
      color: #4e0eff;
      cursor: pointer;
      font-weight: bold;
      font-size: 0.9rem;
      transition: color 0.3s ease;

      &:hover:not(:disabled) {
        color: #997af0;
      }

      &:disabled {
        color: #666;
        cursor: not-allowed;
      }
    }
  }

  .back-btn {
    background: none;
    border: 1px solid #666;
    color: #b3b3b3;
    padding: 0.8rem 1.5rem;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    width: 100%;

    &:hover:not(:disabled) {
      border-color: #997af0;
      color: white;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  @media (min-width: 769px) {
    .otp-container {
      .otp-input {
        width: 3.5rem;
        height: 3.5rem;
        font-size: 1.4rem;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    width: 95%;
    max-width: 400px;

    .otp-container {
      gap: 0.4rem;
      margin: 1.5rem 0;
      
      .otp-input {
        width: 3rem;
        height: 3rem;
        font-size: 1.2rem;
        border-width: 2px;
        min-width: 3rem; /* Ensure minimum width */
        flex-shrink: 0; /* Prevent shrinking */
      }
    }

    .brand h1 {
      font-size: 1.5rem;
    }

    .verify-section h2 {
      font-size: 1.3rem;
    }
  }

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
    width: 98%;

    .otp-container {
      gap: 0.3rem;
      flex-wrap: nowrap; /* Prevent wrapping */
      overflow-x: auto; /* Allow horizontal scroll if needed */
      
      .otp-input {
        width: 2.8rem;
        height: 2.8rem;
        font-size: 1.1rem;
        min-width: 2.8rem;
        flex-shrink: 0;
      }
    }
  }
`;
