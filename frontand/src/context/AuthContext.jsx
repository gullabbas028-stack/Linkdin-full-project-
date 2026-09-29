import React from 'react'
import { createContext } from "react";

export const authContext = createContext();

function AuthContext({ children }) {
  // VITE_API_URL can override this for a different environment. The deployed
  // backend is the default so builds without an injected environment variable
  // still use the production API.
  const serverUrl =
    import.meta.env.VITE_API_URL ||
    "https://https://linkdin-full-project.vercel.app/";

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
