import React, { useState, useEffect } from "react";
import { MdRefresh, MdAccessTime, MdAttachMoney, MdPerson } from "react-icons/md";
import { api } from "../../../services/authService";

import Card from "components/card";
import ComplexTable from "views/admin/default/components/ComplexTable";

const SessionsManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, active, completed

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
                  const [sessionsResponse, tablesResponse] = await Promise.all([
        api.get("/admin/sessions"),
        api.get("/admin/tables"),
      ]);

            setSessions(sessionsResponse.data);
            setTables(tablesResponse.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const getTableNumber = (tableId) => {
        const table = tables.find((t) => t.id === tableId);
        return table ? table.table_number : `ID: ${tableId}`;
    };

    const formatDuration = (minutes) => {
        if (!minutes) return "-";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const getFilteredSessions = () => {
        if (filter === "active") {
            return sessions.filter((session) => session.status === "active");
        } else if (filter === "completed") {
            return sessions.filter((session) => session.status === "completed");
        }
        return sessions;
    };

    const columnsData = [
        {
            Header: "SESSION ID",
            accessor: "session_id",
            Cell: ({ value }) => (
                <div className="font-mono text-sm">
                    {value.substring(0, 8)}...
                </div>
            ),
        },
        {
            Header: "USER",
            accessor: "user_name",
            Cell: ({ value, row }) => (
                <div>
                    <div className="font-semibold">{value}</div>
                    <div className="text-xs text-gray-500">{row.original.user_phone}</div>
                </div>
            ),
        },
        {
            Header: "TABLE",
            accessor: "table_id",
            Cell: ({ value }) => (
                <div className="font-semibold text-brand-500">
                    {getTableNumber(value)}
                </div>
            ),
        },
        {
            Header: "START TIME",
            accessor: "start_time",
            Cell: ({ value }) => (
                <div className="text-sm">
                    {new Date(value).toLocaleString()}
                </div>
            ),
        },
        {
            Header: "DURATION",
            accessor: "duration_minutes",
            Cell: ({ value }) => (
                <div className="font-semibold">
                    {formatDuration(value)}
                </div>
            ),
        },
        {
            Header: "CHARGE",
            accessor: "total_charge",
            Cell: ({ value }) => (
                <div className="font-semibold text-green-600">
                    {value ? `₹${value}` : "In Progress"}
                </div>
            ),
        },
        {
            Header: "STATUS",
            accessor: "status",
            Cell: ({ value }) => (
                <div
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${value === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                >
                    {value}
                </div>
            ),
        },
    ];

    const filteredSessions = getFilteredSessions();
    const activeSessions = sessions.filter((s) => s.status === "active");
    const completedSessions = sessions.filter((s) => s.status === "completed");
    const totalRevenue = completedSessions.reduce(
        (sum, session) => sum + (session.total_charge || 0),
        0
    );

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-lg text-gray-600">Loading sessions...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
                        ⏱️ Gaming Sessions Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Monitor active and completed gaming sessions
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
                >
                    <MdRefresh className="mr-2 h-5 w-5" />
                    Refresh
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-4">
                <Card extra="p-4">
                    <div className="flex items-center">
                        <div className="mr-3 rounded-lg bg-blue-100 p-3">
                            <MdAccessTime className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Sessions</p>
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">
                                {sessions.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card extra="p-4">
                    <div className="flex items-center">
                        <div className="mr-3 rounded-lg bg-green-100 p-3">
                            <MdPerson className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Sessions</p>
                            <p className="text-2xl font-bold text-green-600">
                                {activeSessions.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card extra="p-4">
                    <div className="flex items-center">
                        <div className="mr-3 rounded-lg bg-purple-100 p-3">
                            <MdAccessTime className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Completed Sessions</p>
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">
                                {completedSessions.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card extra="p-4">
                    <div className="flex items-center">
                        <div className="mr-3 rounded-lg bg-yellow-100 p-3">
                            <MdAttachMoney className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-navy-700 dark:text-white">
                                ₹{totalRevenue.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="mb-5">
                <Card extra="p-0">
                    <div className="flex">
                        <button
                            onClick={() => setFilter("all")}
                            className={`flex-1 py-3 px-4 text-center font-semibold ${filter === "all"
                                    ? "bg-brand-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } rounded-l-lg`}
                        >
                            All Sessions ({sessions.length})
                        </button>
                        <button
                            onClick={() => setFilter("active")}
                            className={`flex-1 py-3 px-4 text-center font-semibold ${filter === "active"
                                    ? "bg-brand-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            Active ({activeSessions.length})
                        </button>
                        <button
                            onClick={() => setFilter("completed")}
                            className={`flex-1 py-3 px-4 text-center font-semibold ${filter === "completed"
                                    ? "bg-brand-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } rounded-r-lg`}
                        >
                            Completed ({completedSessions.length})
                        </button>
                    </div>
                </Card>
            </div>

            {/* Sessions Table */}
            {filteredSessions.length === 0 ? (
                <Card>
                    <div className="p-8 text-center">
                        <MdAccessTime className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                        <h3 className="mb-2 text-lg font-semibold text-gray-600">
                            No {filter} sessions found
                        </h3>
                        <p className="text-gray-500">
                            {filter === "active"
                                ? "No gaming sessions are currently active"
                                : filter === "completed"
                                    ? "No sessions have been completed yet"
                                    : "No gaming sessions have been created yet"}
                        </p>
                    </div>
                </Card>
            ) : (
                <ComplexTable
                    columnsData={columnsData}
                    tableData={filteredSessions}
                />
            )}

            {/* Active Sessions Live Monitoring */}
            {activeSessions.length > 0 && (
                <Card extra="mt-5">
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
                            🔴 Live Active Sessions
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {activeSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="rounded-lg border-2 border-green-200 bg-green-50 p-4"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="font-semibold text-navy-700">
                                            {session.user_name}
                                        </h4>
                                        <span className="rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        <strong>Table:</strong> {getTableNumber(session.table_id)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Phone:</strong> {session.user_phone}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Started:</strong>{" "}
                                        {new Date(session.start_time).toLocaleTimeString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Session ID:</strong>{" "}
                                        <span className="font-mono">
                                            {session.session_id.substring(0, 8)}...
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Instructions */}
            <Card extra="mt-8">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
                        📋 Session Management Guide
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="mb-2 font-semibold text-green-600">Active Sessions</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• Monitor real-time gaming sessions</li>
                                <li>• Track session duration and charges</li>
                                <li>• View user details and table assignments</li>
                                <li>• Sessions end automatically when users click "End Session"</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-2 font-semibold text-blue-600">Completed Sessions</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• Review session history and revenue</li>
                                <li>• Analyze peak usage times and patterns</li>
                                <li>• Export data for accounting and reporting</li>
                                <li>• Track customer return visits</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SessionsManagement;
