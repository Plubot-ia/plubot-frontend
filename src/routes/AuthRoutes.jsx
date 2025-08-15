import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ChangePassword from '../components/auth/ChangePassword.jsx';
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice.jsx';
import ForgotPassword from '../components/auth/ForgotPassword.jsx';
import Login from '../components/auth/Login.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import Register from '../components/auth/Register';
import ResendVerification from '../components/auth/ResendVerification.jsx';
import ResetPassword from '../components/auth/ResetPassword.jsx';
import GoogleAuthCallback from '../pages/auth/GoogleAuthCallback.jsx';

const AuthRoutes = () => (
  <Routes>
    <Route path='/login' element={<Login />} />
    <Route path='/register' element={<Register />} />
    <Route path='/resend-verification' element={<ResendVerification />} />
    <Route path='/auth/verify-email' element={<EmailVerificationNotice />} />
    <Route path='/forgot-password' element={<ForgotPassword />} />
    <Route path='/reset-password/:token' element={<ResetPassword />} />
    <Route path='/auth/verify-email/:token' element={<EmailVerificationNotice />} />
    <Route
      path='/change-password'
      element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      }
    />
    <Route path='/auth/google/callback' element={<GoogleAuthCallback />} />
    <Route path='/auth/login' element={<Navigate to='/login' replace />} />
    <Route path='/auth/register' element={<Navigate to='/register' replace />} />
    <Route path='*' element={<Navigate to='/login' replace />} />
  </Routes>
);

export default AuthRoutes;
