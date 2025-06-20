import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { toast } from "react-toastify";
import { forgotPasswordRoute, verifyPasswordResetOTPRoute, resetPasswordRoute } from "../utils/APIRoutes";
import { FiLock, FiEye, FiEyeOff, FiX } from "react-icons/fi";

export default function ChangePassword({ currentUser, onClose }) {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: New Password
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

  const handleSendOTP = async () => {
    setIsLoading(true);

    try {
      const response = await axios.post(forgotPasswordRoute, { 
        email: currentUser.email 
      });

      if (response.data.status) {
        toast.success("Password reset code sent to your email");
        setStep(2);
        setResendCooldown(60);
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
      console.error("Send OTP error:", error);
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
        email: currentUser.email,
        otp: otpCode,
      });

      if (response.data.status) {
        toast.success("Code verified successfully");
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
        email: currentUser.email,
        resetToken,
        newPassword,
      });

      if (response.data.status) {
        toast.success("Password changed successfully!");
        onClose();
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
      const response = await axios.post(forgotPasswordRoute, { 
        email: currentUser.email 
      });

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

  const renderSendOTPStep = () => (
    <ModalContent>
      <ModalHeader>
        <h3>
          <FiLock />
          Change Password
        </h3>
        <CloseButton onClick={onClose} disabled={isLoading}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ModalBody>
        <div className="description">
          <p>To change your password, we'll send a verification code to your email address:</p>
          <p className="email-highlight">{currentUser.email}</p>
        </div>
        
        <ActionButton onClick={handleSendOTP} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Verification Code"}
        </ActionButton>
      </ModalBody>
    </ModalContent>
  );

  const renderOtpStep = () => (
    <ModalContent>
      <ModalHeader>
        <h3>
          <FiLock />
          Enter Verification Code
        </h3>
        <CloseButton onClick={onClose} disabled={isLoading}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ModalBody>
        <div className="description">
          <p>We've sent a 6-digit code to:</p>
          <p className="email-highlight">{currentUser.email}</p>
        </div>
        
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

        <ActionButton
          onClick={handleOtpVerify}
          disabled={isLoading || otp.join("").length !== 6}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </ActionButton>

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
      </ModalBody>
    </ModalContent>
  );

  const renderPasswordStep = () => (
    <ModalContent>
      <ModalHeader>
        <h3>
          <FiLock />
          Set New Password
        </h3>
        <CloseButton onClick={onClose} disabled={isLoading}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ModalBody>
        <form onSubmit={handlePasswordReset}>
          <div className="input-group">
            <FiLock className="input-icon" />
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
            <FiLock className="input-icon" />
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

          <ActionButton type="submit" disabled={isLoading}>
            {isLoading ? "Changing..." : "Change Password"}
          </ActionButton>
        </form>
      </ModalBody>
    </ModalContent>
  );

  return (
    <Modal>
      <Overlay onClick={onClose} />
      {step === 1 && renderSendOTPStep()}
      {step === 2 && renderOtpStep()}
      {step === 3 && renderPasswordStep()}
    </Modal>
  );
}

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  position: relative;
  background: #1a1a1a;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid #333;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #333;
  
  h3 {
    color: white;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.2rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  
  .description {
    margin-bottom: 20px;
    
    p {
      color: #ccc;
      margin: 8px 0;
      font-size: 0.95rem;
    }
    
    .email-highlight {
      color: #4e0eff;
      font-weight: bold;
    }
  }
  
  .input-group {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    transition: border-color 0.2s ease;
    
    &:focus-within {
      border-color: #4e0eff;
    }
    
    .input-icon {
      color: #999;
      margin-right: 12px;
      font-size: 1.1rem;
    }
    
    input {
      background: none;
      border: none;
      color: white;
      flex: 1;
      font-size: 1rem;
      
      &:focus {
        outline: none;
      }
      
      &::placeholder {
        color: #666;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .password-toggle {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      border-radius: 4px;
      margin-left: 8px;
      
      &:hover:not(:disabled) {
        color: white;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
  
  .otp-container {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 20px 0;
    
    .otp-input {
      width: 50px;
      height: 50px;
      text-align: center;
      font-size: 1.2rem;
      font-weight: bold;
      border: 2px solid #333;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: white;
      transition: all 0.2s ease;
      
      &:focus {
        border-color: #4e0eff;
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
    text-align: center;
    margin: 12px 0;
    font-size: 0.9rem;
  }
  
  .resend-section {
    text-align: center;
    margin-top: 20px;
    
    p {
      color: #999;
      margin: 0 0 8px 0;
      font-size: 0.9rem;
    }
    
    .resend-btn {
      background: none;
      border: none;
      color: #4e0eff;
      cursor: pointer;
      font-weight: bold;
      font-size: 0.9rem;
      transition: color 0.2s ease;
      
      &:hover:not(:disabled) {
        color: #7c3aed;
      }
      
      &:disabled {
        color: #666;
        cursor: not-allowed;
      }
    }
  }
  
  @media (max-width: 480px) {
    padding: 20px;
    
    .otp-container {
      gap: 8px;
      
      .otp-input {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }
    }
  }
`;

const ActionButton = styled.button`
  width: 100%;
  background: #4e0eff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  
  &:hover:not(:disabled) {
    background: #7c3aed;
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
