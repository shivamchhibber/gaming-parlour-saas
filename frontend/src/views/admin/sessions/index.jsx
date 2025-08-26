import React, { useState, useEffect } from "react";
import { MdRefresh, MdAccessTime, MdAttachMoney, MdPerson, MdPayment, MdStop } from "react-icons/md";
import { api } from "../../../services/authService";
import Toast from "components/notifications/Toast";
import ConfirmationModal from "components/modal/ConfirmationModal";

import Card from "components/card";

const SessionsManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, active, completed
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

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

            console.log("Sessions data:", sessionsResponse.data);
            console.log("Tables data:", tablesResponse.data);

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

    const handleEndSessionForCash = (session) => {
        setSelectedSession(session);
        setShowConfirmModal(true);
    };

    const handleMarkAsCash = (session) => {
        setSelectedSession(session);
        setShowConfirmModal(true);
    };

    const handleMarkAsPaid = (session) => {
        setSelectedSession({ ...session, actionType: 'mark-paid' });
        setShowConfirmModal(true);
    };

    const confirmEndForCash = async () => {
        setShowConfirmModal(false);
        setActionLoading(true);

        try {
            if (selectedSession.status === "active") {
                // End active session and mark as cash
                await api.post("/admin/session/end-for-cash", {
                    session_id: selectedSession.session_id
                });

                setToast({
                    show: true,
                    message: `✅ Session ended for ${selectedSession.user_name}. Marked as cash payment.`,
                    type: "success"
                });
            } else if (selectedSession.actionType === 'mark-paid') {
                // Mark completed session as online payment
                await api.post("/admin/session/mark-paid", {
                    session_id: selectedSession.session_id
                });

                setToast({
                    show: true,
                    message: `✅ Session for ${selectedSession.user_name} marked as PAID: ₹${selectedSession.total_charge}`,
                    type: "success"
                });
            } else {
                // Mark completed session as cash payment
                await api.post("/admin/session/mark-cash", {
                    session_id: selectedSession.session_id
                });

                setToast({
                    show: true,
                    message: `✅ Session for ${selectedSession.user_name} marked as cash payment: ₹${selectedSession.total_charge}`,
                    type: "success"
                });
            }

            // Refresh data
            fetchData();
        } catch (error) {
            setToast({
                show: true,
                message: error.response?.data?.detail || "Error processing request",
                type: "error"
            });
        } finally {
            setActionLoading(false);
            setSelectedSession(null);
        }
    };

    const getPaymentStatusBadge = (status) => {
        const styles = {
            paid: "bg-green-100 text-green-800",
            cash: "bg-blue-100 text-blue-800",
            unpaid: "bg-red-100 text-red-800",
            pending: "bg-yellow-100 text-yellow-800"
        };

        const icons = {
            paid: "💳",
            cash: "💵",
            unpaid: "⏳",
            pending: "⏳"
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {icons[status] || icons.pending} {status?.toUpperCase() || "PENDING"}
            </span>
        );
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
                    <div>{new Date(value).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{new Date(value).toLocaleTimeString()}</div>
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
            Header: "PAYMENT",
            accessor: "payment_status",
            Cell: ({ value }) => getPaymentStatusBadge(value),
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
        {
            Header: "ACTIONS",
            accessor: "actions",
            Cell: ({ row }) => (
                <div className="flex space-x-2">
                    {row.original.status === "active" && (
                        <button
                            onClick={() => handleEndSessionForCash(row.original)}
                            disabled={actionLoading}
                            className="flex items-center space-x-1 px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-xs"
                            title="End session and collect cash payment"
                        >
                            <MdStop className="w-3 h-3" />
                            <span>End & Cash</span>
                        </button>
                    )}
                    {row.original.status === "completed" && (row.original.payment_status === "pending" || row.original.payment_status === "unpaid") && (
                        <div className="flex space-x-1">
                            <button
                                onClick={() => handleMarkAsCash(row.original)}
                                disabled={actionLoading}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-xs"
                                title="Mark as cash payment"
                            >
                                <MdPayment className="w-3 h-3" />
                                <span>Cash</span>
                            </button>
                            <button
                                onClick={() => handleMarkAsPaid(row.original)}
                                disabled={actionLoading}
                                className="flex items-center space-x-1 px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-xs"
                                title="Mark as online payment"
                            >
                                <MdPayment className="w-3 h-3" />
                                <span>Paid</span>
                            </button>
                        </div>
                    )}
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
                <Card extra="w-full h-full px-6 pb-6">
                    <div className="relative flex items-center justify-between pt-4">
                        <div className="text-xl font-bold text-navy-700 dark:text-white">
                            Sessions Data
                        </div>
                    </div>

                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    {columnsData.map((column, index) => (
                                        <th
                                            key={index}
                                            className="border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                                        >
                                            <p className="text-sm font-bold text-gray-600 dark:text-white">
                                                {column.Header}
                                            </p>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSessions.map((session, rowIndex) => (
                                    <tr key={session.id || rowIndex} className="border-b border-gray-100">
                                        {columnsData.map((column, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className="min-w-[150px] border-white/0 py-3 pr-4"
                                            >
                                                {column.Cell ?
                                                    column.Cell({
                                                        value: session[column.accessor],
                                                        row: { original: session }
                                                    }) :
                                                    (session[column.accessor] || '-')
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
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

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setSelectedSession(null);
                }}
                onConfirm={confirmEndForCash}
                title="End Session & Collect Cash"
                message={selectedSession ?
                    selectedSession.status === "active" ?
                        `End session for ${selectedSession.user_name} at Table ${getTableNumber(selectedSession.table_id)}?\n\nThis will calculate the final bill and mark it as CASH PAYMENT.` :
                        selectedSession.actionType === 'mark-paid' ?
                            `Mark session for ${selectedSession.user_name} as ONLINE PAYMENT?\n\nAmount: ₹${selectedSession.total_charge}` :
                            `Mark session for ${selectedSession.user_name} as CASH PAYMENT?\n\nAmount: ₹${selectedSession.total_charge}` :
                    ""
                }
                confirmText={selectedSession?.status === "active" ? "End & Collect Cash" :
                    selectedSession?.actionType === 'mark-paid' ? "Mark as Paid" : "Mark as Cash"}
                cancelText="Cancel"
                type="warning"
            />

            {/* Toast Notifications */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default SessionsManagement;
