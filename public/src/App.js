import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import SetAvatar from "./components/SetAvatar";
import Settings from "./components/Settings";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./styles/design-system.css"; // World-class design system
import "./styles/global-mobile.css"; // Modern mobile-first styles

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="app">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setAvatar" element={<SetAvatar />} />
            <Route path="/" element={<Chat />} />
          </Routes>
          <Settings />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
