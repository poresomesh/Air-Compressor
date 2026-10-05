import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthState } from "../types/auth";

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check both standard "token" and "plant_token"
    const savedToken = localStorage.getItem("plant_token") || localStorage.getItem("token");
    const savedUser = localStorage.getItem("plant_user") || localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Keep both sync so no component fails
        localStorage.setItem("token", savedToken);
        localStorage.setItem("plant_token", savedToken);
      } catch (err) {
        console.error("Failed to parse saved user", err);
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // Save across both keys so older and newer component checks never fail
    localStorage.setItem("plant_token", newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("plant_user", JSON.stringify(newUser));
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("plant_token");
    localStorage.removeItem("token");
    localStorage.removeItem("plant_user");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};