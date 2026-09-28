import React from 'react'
import { createContext } from "react";

export const authContext = createContext();

function AuthContext({ children }) {
  // In development this falls back to the local backend. In
  // production, set VITE_API_URL in the frontend's environment
  // (e.g. on Vercel) to your deployed backend URL.
  const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  let value = {
    serverUrl,
  };

  return (
    <div>
      <authContext.Provider value={value}>
        {children}
      </authContext.Provider>
    </div>
  );
}

export default AuthContext;
