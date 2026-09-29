import React from 'react'
import { createContext } from "react";

export const authContext = createContext();

function AuthContext({ children }) {
  const serverUrl = "";

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
