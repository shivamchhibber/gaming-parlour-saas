import React from "react";
import { Routes, Route } from "react-router-dom";

// User Interface Pages
import TableScan from "views/user/TableScan";
import UserDetails from "views/user/UserDetails";
import GameSession from "views/user/GameSession";

const UserLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <Routes>
                <Route path="scan/:tableId" element={<TableScan />} />
                <Route path="details/:tableId" element={<UserDetails />} />
                <Route path="session/:sessionId" element={<GameSession />} />
            </Routes>
        </div>
    );
};

export default UserLayout;
