import React from 'react'
import { createContext } from "react";

export const authContext = createContext();

function AuthContext({ children }) {
const serverUrl =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://linkdin-full-project.vercel.app";
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
