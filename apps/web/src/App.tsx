import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./index.css";
import Signup from "./components/Signup";
import Login from "./components/Login";
import ProfileForm from "./components/ProfileForm";
import ProfileView from "./components/ProfileView";
import ChatRoom from "./components/ChatRoom";
import MatchPreferences from "./components/MatchPreferences";
import Live from "./components/Live";
import Dashboard from "./pages/Dashboard";
import AuthWrapper from "./components/AuthWrapper";
import { supabase } from "./lib/supabaseClient";
import { ThemeProvider } from "./context/themeContext";
import HomePage from "./pages/Home";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) localStorage.setItem("token", session.access_token);
      else localStorage.removeItem("token");
      setCheckingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
        if (session) localStorage.setItem("token", session.access_token);
        else localStorage.removeItem("token");
      }
    );

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

  if (checkingAuth) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
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
              <ProfileForm/>
            </AuthWrapper>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <ChatRoom signOut={signOut} />
            </AuthWrapper>
          }
        />
        <Route
          path="/profileview/:username"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <ProfileView />
            </AuthWrapper>
          }
        />
        <Route
          path="/matchpreferences"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <MatchPreferences signOut={signOut} />
            </AuthWrapper>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
                <Route
          path="/live"
          element={
            <AuthWrapper isAuthenticated={isAuthenticated}>
              <Live />
            </AuthWrapper>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;