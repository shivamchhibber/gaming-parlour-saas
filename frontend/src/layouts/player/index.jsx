import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PlayerLogin from "views/player/PlayerLogin";
import PlayerDashboard from "views/player/PlayerDashboard";
import PlayerProfile from "views/player/PlayerProfile";

export default function PlayerLayout() {
    return (
        <div className="flex h-full w-full">
            <div className="h-full w-full">
                <Routes>
                    <Route path="login" element={<PlayerLogin />} />
                    <Route path="dashboard" element={<PlayerDashboard />} />
                    <Route path="profile" element={<PlayerProfile />} />
                    <Route path="*" element={<Navigate to="/player/login" replace />} />
                </Routes>
            </div>
        </div>
    );
}
