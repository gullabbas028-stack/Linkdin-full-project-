import { useContext, useMemo } from "react";
import axios from "axios";
import { authContext } from "../context/AuthContext.jsx";

// Returns an axios instance pre-configured with the API base URL and
// withCredentials, so every new component doesn't have to repeat
// `${serverUrl}/api/...` + { withCredentials: true } by hand.
const useApi = () => {
  const { serverUrl } = useContext(authContext);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: `${serverUrl}/api`,
      withCredentials: true,
    });
    return instance;
  }, [serverUrl]);

  return api;
};

export default useApi;
