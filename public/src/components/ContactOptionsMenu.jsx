import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { BsThreeDotsVertical, BsTrash, BsPersonX, BsEye } from "react-icons/bs";

export default function ContactOptionsMenu({ 
  contact, 
  onDeleteChat, 
  onBlockUser, 
  onViewProfile 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (e) => {
    e.stopPropagation(); // Prevent contact selection when clicking menu
    setIsOpen(!isOpen);
  };

  const handleMenuOption = (action, e) => {
    e.stopPropagation();
    setIsOpen(false);
    action();
  };

  return (
    <MenuContainer ref={menuRef}>
      <MenuTrigger onClick={handleMenuToggle} className={isOpen ? 'active' : ''}>
        <BsThreeDotsVertical />
      </MenuTrigger>
      
      {isOpen && (
        <MenuDropdown>
          <MenuItem onClick={(e) => handleMenuOption(onViewProfile, e)}>
            <BsEye />
            <span>View Profile</span>
          </MenuItem>
          
          <MenuItem onClick={(e) => handleMenuOption(onBlockUser, e)}>
            <BsPersonX />
            <span>Block User</span>
          </MenuItem>
          
          <MenuDivider />
          
          <MenuItem 
            onClick={(e) => handleMenuOption(onDeleteChat, e)} 
            className="danger"
          >
            <BsTrash />
            <span>Delete Chat</span>
          </MenuItem>
        </MenuDropdown>
      )}
    </MenuContainer>
  );
}

const MenuContainer = styled.div`
  position: relative;
  z-index: 10;
`;

const MenuTrigger = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme?.textSecondary || '#64748B'};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.8);
  
  &:hover, &.active {
    background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.theme?.textPrimary || '#ffffff'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.theme?.surfaceElevated || '#1e293b'};
  border: 1px solid ${props => props.theme?.surfaceBorder || '#334155'};
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  overflow: hidden;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MenuItem = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.05)'};
  }
  
  &.danger {
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
  
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  
  span {
    flex: 1;
    text-align: left;
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: ${props => props.theme?.surfaceBorder || '#334155'};
  margin: 4px 0;
`;
