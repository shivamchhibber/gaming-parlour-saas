import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GameParlourSignup from "views/public/GameParlourSignup";
import PaymentSuccess from "views/public/PaymentSuccess";

export default function PublicLayout() {
    return (
        <div className="flex h-full w-full">
            <div className="h-full w-full">
                <Routes>
                    <Route path="signup" element={<GameParlourSignup />} />
                    <Route path="payment/success" element={<PaymentSuccess />} />
                    <Route path="*" element={<Navigate to="/public/signup" replace />} />
                </Routes>
            </div>
        </div>
    );
}
