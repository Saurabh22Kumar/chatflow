import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../utils/themes';

const SettingsContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100vh;
  background: var(--surface-color);
  border-left: 1px solid var(--border-color);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    color: var(--text-color);
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary-color);
  cursor: pointer;
  
  &:hover {
    color: var(--text-color);
  }
`;

const SettingSection = styled.div`
  margin-bottom: 30px;
  
  h3 {
    color: var(--text-color);
    margin-bottom: 15px;
    font-size: 16px;
  }
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const ThemeCard = styled.div`
  padding: 15px;
  border: 2px solid ${props => props.isActive ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.theme.background};
  
  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
  }
  
  .theme-name {
    font-weight: 600;
    color: ${props => props.theme.text};
    margin-bottom: 8px;
  }
  
  .theme-preview {
    display: flex;
    gap: 5px;
    
    .color-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
  }
`;

const ToggleSwitch = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  input {
    display: none;
  }
  
  .switch {
    width: 50px;
    height: 26px;
    background: ${props => props.checked ? 'var(--primary-color)' : 'var(--border-color)'};
    border-radius: 13px;
    position: relative;
    transition: background 0.3s ease;
    margin-right: 10px;
    
    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: ${props => props.checked ? '26px' : '2px'};
      width: 22px;
      height: 22px;
      background: white;
      border-radius: 50%;
      transition: left 0.3s ease;
    }
  }
  
  span {
    color: var(--text-color);
  }
`;

const SettingsButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--gradient);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, isDarkMode, changeTheme, toggleDarkMode } = useTheme();

  return (
    <>
      <SettingsButton onClick={() => setIsOpen(true)}>
        ⚙️
      </SettingsButton>
      
      <SettingsContainer isOpen={isOpen}>
        <SettingsHeader>
          <h2>Settings</h2>
          <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
        </SettingsHeader>
        
        <SettingSection>
          <h3>Appearance</h3>
          <ToggleSwitch checked={isDarkMode}>
            <input 
              type="checkbox" 
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
            <div className="switch"></div>
            <span>Dark Mode</span>
          </ToggleSwitch>
        </SettingSection>
        
        <SettingSection>
          <h3>Theme</h3>
          <ThemeGrid>
            {Object.entries(themes).map(([key, themeData]) => (
              <ThemeCard
                key={key}
                isActive={currentTheme === key}
                theme={themeData}
                onClick={() => changeTheme(key)}
              >
                <div className="theme-name">{themeData.name}</div>
                <div className="theme-preview">
                  <div 
                    className="color-dot" 
                    style={{ backgroundColor: themeData.primary }}
                  ></div>
                  <div 
                    className="color-dot" 
                    style={{ backgroundColor: themeData.secondary }}
                  ></div>
                  <div 
                    className="color-dot" 
                    style={{ backgroundColor: themeData.accent }}
                  ></div>
                </div>
              </ThemeCard>
            ))}
          </ThemeGrid>
        </SettingSection>
      </SettingsContainer>
    </>
  );
};

export default Settings;
