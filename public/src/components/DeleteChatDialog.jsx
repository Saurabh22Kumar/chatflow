import React from "react";
import styled from "styled-components";
import { BsTrash, BsX } from "react-icons/bs";

export default function DeleteChatDialog({ 
  isOpen, 
  contactName, 
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <DialogOverlay onClick={onCancel}>
      <DialogContainer onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogIcon>
            <BsTrash />
          </DialogIcon>
          <DialogTitle>Delete Chat</DialogTitle>
          <CloseButton onClick={onCancel}>
            <BsX />
          </CloseButton>
        </DialogHeader>
        
        <DialogContent>
          <DialogMessage>
            Deleting this chat with <strong>{contactName}</strong> will:
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Delete the entire chat history</li>
              <li>Remove {contactName} from your contacts list</li>
              <li>Remove you from {contactName}'s contacts list</li>
            </ul>
            <br />
            <strong>Note:</strong> You remain friends and can easily reconnect by searching for and messaging each other again.
          </DialogMessage>
        </DialogContent>
        
        <DialogActions>
          <CancelButton onClick={onCancel}>
            Cancel
          </CancelButton>
          <DeleteButton onClick={onConfirm}>
            Delete
          </DeleteButton>
        </DialogActions>
      </DialogContainer>
    </DialogOverlay>
  );
}

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const DialogContainer = styled.div`
  background: ${props => props.theme?.surfaceElevated || '#1e293b'};
  border: 1px solid ${props => props.theme?.surfaceBorder || '#334155'};
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 420px;
  width: 90%;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 24px 16px 24px;
  position: relative;
`;

const DialogIcon = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  
  svg {
    width: 20px;
    height: 20px;
    color: #ef4444;
  }
`;

const DialogTitle = styled.h3`
  flex: 1;
  margin: 0;
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme?.textSecondary || '#64748B'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.theme?.textPrimary || '#ffffff'};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const DialogContent = styled.div`
  padding: 0 24px 24px 24px;
`;

const DialogMessage = styled.p`
  margin: 0;
  color: ${props => props.theme?.textSecondary || '#94a3b8'};
  font-size: 14px;
  line-height: 1.5;
  
  strong {
    color: ${props => props.theme?.textPrimary || '#ffffff'};
    font-weight: 600;
  }
`;

const DialogActions = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px 24px;
  justify-content: flex-end;
  border-top: 1px solid ${props => props.theme?.surfaceBorder || '#334155'};
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme?.surfaceBorder || '#334155'};
  color: ${props => props.theme?.textSecondary || '#94a3b8'};
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.theme?.textSecondary || '#64748B'};
    color: ${props => props.theme?.textPrimary || '#ffffff'};
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  border: 1px solid #ef4444;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #dc2626;
    border-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
