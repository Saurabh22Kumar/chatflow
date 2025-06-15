import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import SetAvatar from "./components/SetAvatar";
import Settings from "./components/Settings";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./styles/global.css"; // New global styles

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
