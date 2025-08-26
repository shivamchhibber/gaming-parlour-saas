import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdGames, MdTableChart, MdAccessTime, MdAttachMoney } from "react-icons/md";
import { api } from "../../../services/authService";
import { IoDocuments } from "react-icons/io5";

import Widget from "components/widget/Widget";
import CheckTable from "views/admin/default/components/CheckTable";
import RevenueChart from "./components/RevenueChart";
import SessionAnalytics from "./components/SessionAnalytics";

const GameParlourDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalTables: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalRevenue: 0,
    });
    const [recentSessions, setRecentSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [tablesResponse, sessionsResponse] = await Promise.all([
                api.get("/admin/tables"),
                api.get("/admin/sessions"),
            ]);

            const tables = tablesResponse.data;
            const sessions = sessionsResponse.data;

            const activeSessions = sessions.filter(session => session.status === "active");
            const completedSessions = sessions.filter(session => session.status === "completed");
            const totalRevenue = completedSessions.reduce((sum, session) => sum + (session.total_charge || 0), 0);

            setStats({
                totalTables: tables.length,
                activeSessions: activeSessions.length,
                completedSessions: completedSessions.length,
                totalRevenue: totalRevenue.toFixed(2),
            });

            // Create a map of table IDs to table numbers for better display
            const tableMap = {};
            tables.forEach(table => {
                tableMap[table.id] = table.table_number;
            });

            // Get recent sessions for table with proper table numbers
            const recentSessionsData = sessions
                .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
                .slice(0, 10)
                .map((session, index) => ({
                    id: index + 1,
                    name: session.user_name,
                    phone: session.user_phone,
                    table: tableMap[session.table_id] || `T${session.table_id}`,
                    status: session.status,
                    charge: session.total_charge ? `₹${session.total_charge}` : "In Progress",
                    date: new Date(session.start_time).toLocaleDateString(),
                }));

            setRecentSessions(recentSessionsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
        }
    };

    const columnsDataSessions = [
        {
            Header: "USER",
            accessor: "name",
        },
        {
            Header: "PHONE",
            accessor: "phone",
        },
        {
            Header: "TABLE",
            accessor: "table",
        },
        {
            Header: "STATUS",
            accessor: "status",
        },
        {
            Header: "CHARGE",
            accessor: "charge",
        },
        {
            Header: "DATE",
            accessor: "date",
        },
    ];

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-lg text-gray-600">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome Header */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
                    🎮 Game Parlour Management Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Monitor your gaming tables, sessions, and revenue in real-time
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                <Widget
                    icon={<MdTableChart className="h-7 w-7" />}
                    title={"Total Tables"}
                    subtitle={stats.totalTables.toString()}
                />
                <Widget
                    icon={<MdGames className="h-6 w-6" />}
                    title={"Active Sessions"}
                    subtitle={stats.activeSessions.toString()}
                />
                <Widget
                    icon={<IoDocuments className="h-7 w-7" />}
                    title={"Completed Sessions"}
                    subtitle={stats.completedSessions.toString()}
                />
                <Widget
                    icon={<MdAttachMoney className="h-6 w-6" />}
                    title={"Total Revenue"}
                    subtitle={`₹${stats.totalRevenue}`}
                />
            </div>

            {/* Charts Section */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <RevenueChart />
                <SessionAnalytics />
            </div>

            {/* Recent Sessions Table */}
            <div className="mt-5">
                <div className="rounded-[20px] bg-white px-6 pb-6 pt-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                            Recent Gaming Sessions
                        </h2>
                        <button
                            onClick={fetchDashboardData}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                        >
                            Refresh
                        </button>
                    </div>
                    <div className="mt-4">
                        {recentSessions.length > 0 ? (
                            <CheckTable
                                columnsData={columnsDataSessions}
                                tableData={recentSessions}
                            />
                        ) : (
                            <div className="flex h-32 items-center justify-center text-gray-500">
                                No sessions found. Create some tables and start gaming!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="rounded-[20px] bg-white p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
                    <div className="mb-4 flex items-center">
                        <MdTableChart className="mr-3 h-8 w-8 text-brand-500" />
                        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                            Manage Tables
                        </h3>
                    </div>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                        Add new gaming tables, set rates, and generate QR codes
                    </p>
                    <button
                        onClick={() => navigate("/admin/tables-management")}
                        className="w-full rounded-lg bg-brand-500 py-2 text-white hover:bg-brand-600 transition-colors"
                    >
                        Go to Tables
                    </button>
                </div>

                <div className="rounded-[20px] bg-white p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
                    <div className="mb-4 flex items-center">
                        <MdAccessTime className="mr-3 h-8 w-8 text-green-500" />
                        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                            Active Sessions
                        </h3>
                    </div>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                        Monitor ongoing gaming sessions and manage billing
                    </p>
                    <button
                        onClick={() => navigate("/admin/sessions")}
                        className="w-full rounded-lg bg-green-500 py-2 text-white hover:bg-green-600 transition-colors"
                    >
                        View Sessions
                    </button>
                </div>

                <div className="rounded-[20px] bg-white p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
                    <div className="mb-4 flex items-center">
                        <MdGames className="mr-3 h-8 w-8 text-purple-500" />
                        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                            User Interface
                        </h3>
                    </div>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                        Test the user experience for QR scanning and session management
                    </p>
                    <button
                        onClick={() => navigate("/admin/user-interface")}
                        className="w-full rounded-lg bg-purple-500 py-2 text-white hover:bg-purple-600 transition-colors"
                    >
                        Try User Flow
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameParlourDashboard;
