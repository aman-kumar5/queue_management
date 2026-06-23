import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import WaitingRoom from './pages/WaitingRoom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Receptionist Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Patient Waiting Room Display */}
        <Route 
          path="/waiting-room" 
          element={
            <ProtectedRoute allowedRoles={['receptionist', 'patient']}>
              <WaitingRoom />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
