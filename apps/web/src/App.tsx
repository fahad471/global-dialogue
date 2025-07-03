// import { useState } from 'react';
// import reactLogo from './assets/react.svg';
// import viteLogo from '/vite.svg';
// import './App.css';

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
//     </>
//   );
// }

// export default App;
// import { Routes, Route } from 'react-router-dom';
// import Signup from './components/Signup';
// import Login from './components/Login';
// import ProfileForm from './components/ProfileForm';
// import ChatRoom from './components/ChatRoom';
// import MatchPreferences from './components/MatchPreferences';
// import Dashboard from './pages/Dashboard';

// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/profile" element={<ProfileForm />} />
//       <Route path="/chat" element={<ChatRoom />} />
//       <Route path="/matchpreferences" element={<MatchPreferences />} />
//       <Route path="/dashboard" element={<Dashboard />} />
//       {/* other routes */}
//     </Routes>
//   );
// }

// export default App;

import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./index.css";
import Signup from "./components/Signup";
import Login from "./components/Login";
import ProfileForm from "./components/ProfileForm";
import ChatRoom from "./components/ChatRoom";
import MatchPreferences from "./components/MatchPreferences";
import Dashboard from "./pages/Dashboard";
import AuthWrapper from "./components/AuthWrapper";
import { supabase } from "./lib/supabaseClient";
import { ThemeProvider } from "./context/themeContext"; // import your theme provider

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Setup auth state on mount and subscribe to changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) localStorage.setItem("token", session.access_token);
      else localStorage.removeItem("token");
    });

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
        if (session) localStorage.setItem("token", session.access_token);
        else localStorage.removeItem("token");
      }
    );

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error.message);
    } else {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      navigate("/login");
    }
  }, [navigate]);

  return (
    <ThemeProvider>
      <Routes>
        {/* Redirect root '/' to dashboard if authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <Dashboard signOut={signOut} />
            </AuthWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <ProfileForm />
            </AuthWrapper>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <ChatRoom />
            </AuthWrapper>
          }
        />
        <Route
          path="/matchpreferences"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <MatchPreferences />
            </AuthWrapper>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
