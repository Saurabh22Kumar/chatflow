import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { toast } from "react-toastify";
import { forgotPasswordRoute, verifyPasswordResetOTPRoute, resetPasswordRoute } from "../utils/APIRoutes";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
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
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setResendCooldown(resendCooldown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(forgotPasswordRoute, { email });

      if (response.data.status) {
        toast.success(response.data.msg);
        setStep(2);
        setResendCooldown(60); // 60 seconds cooldown
        // Focus first OTP input
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
      handleOtpVerify();
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

  const handleOtpVerify = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(verifyPasswordResetOTPRoute, {
        email,
        otp: otpCode,
      });

      if (response.data.status) {
        toast.success(response.data.msg);
        setResetToken(response.data.resetToken);
        setStep(3);
      } else {
        if (response.data.expired) {
          toast.error("Verification code has expired. Please request a new one.");
        } else if (response.data.maxAttemptsExceeded) {
          toast.error("Maximum attempts exceeded. Please start over.");
          setStep(1);
          setOtp(["", "", "", "", "", ""]);
        } else {
          toast.error(response.data.msg);
          if (response.data.remainingAttempts !== undefined) {
            setRemainingAttempts(response.data.remainingAttempts);
          }
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password should be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(resetPasswordRoute, {
        email,
        resetToken,
        newPassword,
      });

      if (response.data.status) {
        toast.success(response.data.msg);
        // Go back to login after successful reset
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);

    try {
      const response = await axios.post(forgotPasswordRoute, { email });

      if (response.data.status) {
        toast.success("New reset code sent to your email");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        setRemainingAttempts(5);
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        toast.error(response.data.msg);
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <Container>
      <FormContainer>
        <div className="brand">
          <img src="/logo192.png" alt="Logo" />
          <h1>ChatFlow</h1>
        </div>
        
        <div className="reset-section">
          <h2>Reset Your Password</h2>
          <p className="description">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>
          
          <form onSubmit={handleEmailSubmit}>
            <div className="input-group">
              <div className="input-icon">
                <FiMail />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToLogin}
            className="back-btn"
            disabled={isLoading}
          >
            <FiArrowLeft /> Back to Login
          </button>
        </div>
      </FormContainer>
    </Container>
  );

  const renderOtpStep = () => (
    <Container>
      <FormContainer>
        <div className="brand">
          <img src="/logo192.png" alt="Logo" />
          <h1>ChatFlow</h1>
        </div>
        
        <div className="reset-section">
          <h2>Enter Verification Code</h2>
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
            onClick={handleOtpVerify}
            disabled={isLoading || otp.join("").length !== 6}
            className="submit-btn"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
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
            onClick={() => setStep(1)}
            className="back-btn"
            disabled={isLoading}
          >
            <FiArrowLeft /> Change Email
          </button>
        </div>
      </FormContainer>
    </Container>
  );

  const renderPasswordStep = () => (
    <Container>
      <FormContainer>
        <div className="brand">
          <img src="/logo192.png" alt="Logo" />
          <h1>ChatFlow</h1>
        </div>
        
        <div className="reset-section">
          <h2>Set New Password</h2>
          <p className="description">
            Choose a strong password for your account.
          </p>
          
          <form onSubmit={handlePasswordReset}>
            <div className="input-group">
              <div className="input-icon">
                <FiLock />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
                required
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
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
                required
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

            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToLogin}
            className="back-btn"
            disabled={isLoading}
          >
            <FiArrowLeft /> Back to Login
          </button>
        </div>
      </FormContainer>
    </Container>
  );

  switch (step) {
    case 1:
      return renderEmailStep();
    case 2:
      return renderOtpStep();
    case 3:
      return renderPasswordStep();
    default:
      return renderEmailStep();
  }
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

  .reset-section {
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

    .description, .email-text {
      color: #b3b3b3;
      margin: 0;
      text-align: center;
      font-size: 0.9rem;
    }

    .email-highlight {
      color: #4e0eff;
      font-weight: bold;
      margin: 0;
      text-align: center;
      word-break: break-all;
    }
  }

  .input-group {
    display: flex;
    background-color: transparent;
    padding: 1rem;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    border: 0.1rem solid #4e0eff;
    transition: border 0.3s ease-in-out;
    position: relative;
    align-items: center;

    &:focus-within {
      border: 0.1rem solid #997af0;
      outline: none;
    }

    .input-icon {
      margin-right: 1rem;
      color: #997af0;
      font-size: 1.2rem;
    }

    input {
      background-color: transparent;
      padding: 0;
      border: none;
      color: white;
      width: 100%;
      font-size: 1rem;

      &:focus {
        outline: none;
      }

      &::selection {
        background-color: #997af0;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .password-toggle {
      background: none;
      border: none;
      color: #997af0;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      margin-left: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        color: white;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
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
    }
  }

  .attempts-warning {
    color: #ff6b6b;
    margin: 0;
    font-size: 0.9rem;
    text-align: center;
  }

  .submit-btn {
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

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
        min-width: 3rem;
        flex-shrink: 0;
      }
    }

    .brand h1 {
      font-size: 1.5rem;
    }

    .reset-section h2 {
      font-size: 1.3rem;
    }
  }

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
    width: 98%;

    .otp-container {
      gap: 0.3rem;
      flex-wrap: nowrap;
      overflow-x: auto;
      
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
