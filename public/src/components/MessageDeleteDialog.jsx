import React from "react";
import styled from "styled-components";
import { BsTrash, BsX } from "react-icons/bs";

export default function MessageDeleteDialog({ 
  isOpen, 
  selectedCount,
  canDeleteForEveryone,
  hasMessages = false,
  hasCallHistory = false,
  onConfirm, 
  onClose 
}) {
  if (!isOpen) return null;

  const handleDeleteForMe = () => {
    onConfirm('forMe');
  };

  const handleDeleteForEveryone = () => {
    onConfirm('forEveryone');
  };

  // Generate appropriate title and message based on selection
  const getSelectionInfo = () => {
    if (hasMessages && hasCallHistory) {
      return {
        title: `Delete ${selectedCount} items?`,
        message: `Choose how you want to delete the selected messages and call history:`
      };
    } else if (hasMessages) {
      return {
        title: `Delete ${selectedCount} message${selectedCount > 1 ? 's' : ''}?`,
        message: `Choose how you want to delete ${selectedCount > 1 ? 'these messages' : 'this message'}:`
      };
    } else if (hasCallHistory) {
      return {
        title: `Delete ${selectedCount} call history ${selectedCount > 1 ? 'entries' : 'entry'}?`,
        message: `Choose how you want to delete the selected call history:`
      };
    } else {
      return {
        title: `Delete ${selectedCount} items?`,
        message: `Choose how you want to delete the selected items:`
      };
    }
  };

  const { title, message } = getSelectionInfo();

  return (
    <DialogOverlay onClick={onClose}>
      <DialogContainer onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <CloseButton onClick={onClose}>
            <BsX />
          </CloseButton>
        </DialogHeader>
        
        <DialogContent>
          <DialogMessage>
            {message}
          </DialogMessage>
          {hasMessages && hasCallHistory && (
            <SelectionDetails>
              This will delete both messages and call history entries.
            </SelectionDetails>
          )}
        </DialogContent>
        
        <DialogActions>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton variant="danger" onClick={handleDeleteForMe}>
            <BsTrash />
            Delete for me
          </ActionButton>
          {canDeleteForEveryone && (
            <ActionButton variant="danger-primary" onClick={handleDeleteForEveryone}>
              <BsTrash />
              Delete for everyone
            </ActionButton>
          )}
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(4px);
    }
  }
`;

const DialogContainer = styled.div`
  background: ${props => props.theme?.surface || '#1F2937'};
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    max-width: 90vw;
    border-radius: 12px;
  }
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
`;

const DialogTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme?.textSecondary || '#9CA3AF'};
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.theme?.textPrimary || '#ffffff'};
  }
`;

const DialogContent = styled.div`
  padding: 16px 24px;
`;

const DialogMessage = styled.p`
  margin: 0;
  color: ${props => props.theme?.textSecondary || '#9CA3AF'};
  font-size: 14px;
  line-height: 1.5;
`;

const SelectionDetails = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: ${props => props.theme?.type === 'dark' 
    ? 'rgba(255, 165, 0, 0.1)' 
    : 'rgba(255, 140, 0, 0.1)'
  };
  border: 1px solid ${props => props.theme?.type === 'dark' 
    ? 'rgba(255, 165, 0, 0.2)' 
    : 'rgba(255, 140, 0, 0.2)'
  };
  border-radius: 8px;
  font-size: 13px;
  color: ${props => props.theme?.type === 'dark' ? '#FFA500' : '#FF8C00'};
  text-align: center;
`;

const DialogActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px 24px;
`;

const ActionButton = styled.button`
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;

  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background: transparent;
          color: ${props.theme?.textSecondary || '#9CA3AF'};
          border: 1px solid ${props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
          
          &:hover {
            background: ${props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.05)'};
            color: ${props.theme?.textPrimary || '#ffffff'};
          }
        `;
      case 'danger':
        return `
          background: transparent;
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          
          &:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
          }
        `;
      case 'danger-primary':
        return `
          background: #ef4444;
          color: white;
          border: 1px solid #ef4444;
          
          &:hover {
            background: #dc2626;
            transform: translateY(-1px);
          }
        `;
      default:
        return '';
    }
  }}

  svg {
    font-size: 16px;
  }
`;
