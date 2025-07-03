import React from "react"
import { Navigate } from "react-router-dom"

interface AuthWrapperProps {
  isAuthenticated: boolean
  children: React.ReactElement
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // User not logged in — redirect to login
    return <Navigate to="/login" replace />
  }
  // User logged in — allow access
  return children
}

export default AuthWrapper
