import { useState, useEffect, useCallback } from "react";
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
import { ThemeProvider } from "./context/themeContext";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

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

    // Correct cleanup: unsubscribe function directly
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
              <ProfileForm signOut={signOut} />
            </AuthWrapper>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              {/* pass signOut here */}
              <ChatRoom signOut={signOut} />
            </AuthWrapper>
          }
        />
        <Route
          path="/matchpreferences"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              {/* pass signOut here */}
              <MatchPreferences signOut={signOut} />
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
