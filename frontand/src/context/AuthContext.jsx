import React from 'react'
import { createContext } from "react";

export const authContext = createContext();

function AuthContext({ children }) {
  // Use same-origin API routes by default; VITE_API_URL can override them.
  const serverUrl = import.meta.env.VITE_API_URL || "";

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
