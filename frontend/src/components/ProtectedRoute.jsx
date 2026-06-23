import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const sessionData = localStorage.getItem('queue_cure_session');
  
  if (!sessionData) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  try {
    const session = JSON.parse(sessionData);
    
    if (!allowedRoles.includes(session.role)) {
      // Role is not authorized for this page
      if (session.role === 'patient') {
        // Patients are only allowed in the waiting room
        return <Navigate to="/waiting-room" replace />;
      } else {
        // Fallback
        return <Navigate to="/login" replace />;
      }
    }
    
    return children;
  } catch (error) {
    console.error('Error parsing session data:', error);
    localStorage.removeItem('queue_cure_session');
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;
