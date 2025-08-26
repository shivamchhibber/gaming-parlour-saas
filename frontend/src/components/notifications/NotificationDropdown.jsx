import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/authService";
import { MdGames, MdAccessTime, MdAttachMoney } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const [sessionsResponse, tablesResponse] = await Promise.all([
                api.get("/admin/sessions"),
                api.get("/admin/tables"),
            ]);

            const sessions = sessionsResponse.data;
            const tables = tablesResponse.data;

            // Create a map for table numbers
            const tableMap = {};
            tables.forEach(table => {
                tableMap[table.id] = table.table_number;
            });

            const notifications = [];
            const now = new Date();

            // Recent completed sessions (last 24 hours)
            const recentCompletedSessions = sessions
                .filter(session => {
                    if (session.status !== "completed" || !session.end_time) return false;
                    const endTime = new Date(session.end_time);
                    const hoursDiff = (now - endTime) / (1000 * 60 * 60);
                    return hoursDiff <= 24;
                })
                .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
                .slice(0, 3);

            recentCompletedSessions.forEach(session => {
                notifications.push({
                    id: `completed-${session.session_id}`,
                    type: "completed",
                    title: "Session Completed",
                    message: `${session.user_name} finished playing at ${tableMap[session.table_id] || `Table ${session.table_id}`}`,
                    amount: session.total_charge,
                    time: new Date(session.end_time),
                    icon: MdAttachMoney,
                    color: "green",
                });
            });

            // Active sessions
            const activeSessions = sessions
                .filter(session => session.status === "active")
                .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
                .slice(0, 3);

            activeSessions.forEach(session => {
                const startTime = new Date(session.start_time);
                const duration = Math.floor((now - startTime) / (1000 * 60)); // in minutes

                notifications.push({
                    id: `active-${session.session_id}`,
                    type: "active",
                    title: "Active Session",
                    message: `${session.user_name} playing at ${tableMap[session.table_id] || `Table ${session.table_id}`} for ${duration} min`,
                    time: startTime,
                    icon: MdGames,
                    color: "blue",
                });
            });

            // New sessions started recently (last 2 hours)
            const newSessions = sessions
                .filter(session => {
                    const startTime = new Date(session.start_time);
                    const hoursDiff = (now - startTime) / (1000 * 60 * 60);
                    return hoursDiff <= 2;
                })
                .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
                .slice(0, 2);

            newSessions.forEach(session => {
                if (!notifications.find(n => n.id === `active-${session.session_id}`)) {
                    notifications.push({
                        id: `new-${session.session_id}`,
                        type: "new",
                        title: "New Session Started",
                        message: `${session.user_name} started playing at ${tableMap[session.table_id] || `Table ${session.table_id}`}`,
                        time: new Date(session.start_time),
                        icon: MdAccessTime,
                        color: "purple",
                    });
                }
            });

            // Revenue milestones (if any high-value sessions)
            const highValueSessions = recentCompletedSessions.filter(session => session.total_charge > 1000);
            highValueSessions.forEach(session => {
                notifications.push({
                    id: `revenue-${session.session_id}`,
                    type: "revenue",
                    title: "High Revenue Session",
                    message: `₹${session.total_charge} earned from ${session.user_name}`,
                    time: new Date(session.end_time),
                    icon: MdAttachMoney,
                    color: "gold",
                });
            });

            // Sort by time (newest first)
            notifications.sort((a, b) => b.time - a.time);

            setNotifications(notifications.slice(0, 5)); // Show only 5 most recent
            setLoading(false);
        } catch (error) {
            console.error("Error generating notifications:", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        generateNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(generateNotifications, 30000);
        return () => clearInterval(interval);
    }, [generateNotifications]);

    const getTimeAgo = (time) => {
        const now = new Date();
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return time.toLocaleDateString();
    };

    const getIconColor = (color) => {
        switch (color) {
            case "green": return "bg-green-500";
            case "blue": return "bg-blue-500";
            case "purple": return "bg-purple-500";
            case "gold": return "bg-yellow-500";
            default: return "bg-brand-500";
        }
    };

    return (
        <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none sm:w-[460px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-base font-bold text-navy-700 dark:text-white">
                    Live Notifications
                </p>
                <button
                    onClick={generateNotifications}
                    className="text-sm font-medium text-brand-500 hover:text-brand-600"
                >
                    Refresh
                </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-gray-500">Loading notifications...</div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <IoMdNotificationsOutline className="h-12 w-12 mb-2 opacity-50" />
                        <p>No recent notifications</p>
                        <p className="text-xs">New activity will appear here</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const IconComponent = notification.icon;
                        return (
                            <div key={notification.id} className="flex w-full items-start py-2 hover:bg-gray-50 dark:hover:bg-navy-600 rounded-lg px-2 transition-colors">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getIconColor(notification.color)} text-xl text-white flex-shrink-0`}>
                                    <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                {notification.message}
                                            </p>
                                            {notification.amount && (
                                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                                                    Revenue: ₹{notification.amount}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                            {getTimeAgo(notification.time)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                        Showing {notifications.length} recent notifications
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
