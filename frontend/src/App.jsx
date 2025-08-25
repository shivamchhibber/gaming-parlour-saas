import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import UserLayout from "layouts/user";
import ProtectedRoute from "components/ProtectedRoute";

// Redirect component for old QR code URLs
const OldQRRedirect = () => {
  const { tableId } = useParams();
  return <Navigate to={`/user/scan/${tableId}`} replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="auth/*" element={<AuthLayout />} />
      <Route path="admin/*" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      } />
      <Route path="user/*" element={<UserLayout />} />
      <Route path="rtl/*" element={<RtlLayout />} />
      {/* Redirect old QR code URLs to new format */}
      <Route path="scan/:tableId" element={<OldQRRedirect />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default App;
