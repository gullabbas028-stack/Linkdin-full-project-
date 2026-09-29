import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { authContext } from "./AuthContext.jsx";

export const userDatacontext = createContext();

const UserContext = ({ children }) => {
  const [userData, setUserData] = useState(null);
  // Starts true so protected routes don't redirect to /login before
  // we've actually checked whether a valid session cookie exists.
  const [authLoading, setAuthLoading] = useState(true);

  const { serverUrl } = useContext(authContext);

  const getCurrentUser = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/user/currentuser`,
        {
          withCredentials: true,
        }
      );

      setUserData(result.data.user || null);
    } catch (error) {
      if (error.response?.status === 401) {
        setUserData(null);
        return;
      }

      console.error(
        "Error fetching current user:",
        error.response?.data || error.message
      );

      setUserData(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, [serverUrl]);

  const value = {
    userData,
    setUserData,
    getCurrentUser,
    authLoading,
  };

  return (
    <userDatacontext.Provider value={value}>
      {children}
    </userDatacontext.Provider>
  );
};

export default UserContext;
