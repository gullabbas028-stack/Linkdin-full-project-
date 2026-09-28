import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Signup from "./pages/signup";
import Login from "./pages/login";
import Profile from "./components/Profile.jsx";
import Search from "./pages/Search.jsx";
import Connections from "./pages/Connections.jsx";
import Notifications from "./pages/Notifications.jsx";
import Messages from "./pages/Messages.jsx";

import { userDatacontext } from "./context/UserContext.jsx";

// Small full-screen loader shown while we check for an existing
// session (cookie) on first load / refresh, so protected routes
// don't flash to /login before we actually know the auth state.
const SplashScreen = () => (
  <div className="w-full min-h-screen flex items-center justify-center bg-[#f3f2ef] text-gray-500 text-sm">
    Loading...
  </div>
);

const App = () => {
  const { userData, authLoading } = React.useContext(userDatacontext);

  if (authLoading) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      {/* HOME */}
      <Route
        path="/"
        element={userData ? <Home /> : <Navigate to="/login" />}
      />

      {/* SIGNUP */}
      <Route
        path="/signup"
        element={userData ? <Navigate to="/" /> : <Signup />}
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={userData ? <Navigate to="/" /> : <Login />}
      />

      {/* OWN PROFILE (redirects to /profile/:userName) */}
      <Route
        path="/profile"
        element={
          userData ? (
            <Navigate to={`/profile/${userData.userName}`} replace />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* ANY USER'S PROFILE */}
      <Route
        path="/profile/:userName"
        element={userData ? <Profile /> : <Navigate to="/login" />}
      />

      {/* SEARCH */}
      <Route
        path="/search"
        element={userData ? <Search /> : <Navigate to="/login" />}
      />

      {/* MY NETWORK / CONNECTIONS */}
      <Route
        path="/connections"
        element={userData ? <Connections /> : <Navigate to="/login" />}
      />

      {/* NOTIFICATIONS */}
      <Route
        path="/notifications"
        element={userData ? <Notifications /> : <Navigate to="/login" />}
      />

      {/* MESSAGES */}
      <Route
        path="/messages"
        element={userData ? <Messages /> : <Navigate to="/login" />}
      />
      <Route
        path="/messages/:userId"
        element={userData ? <Messages /> : <Navigate to="/login" />}
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to={userData ? "/" : "/login"} />}
      />
    </Routes>
  );
};

export default App;
