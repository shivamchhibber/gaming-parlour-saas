import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/authService";
import { IoMdNotificationsOutline } from "react-icons/io";

const NotificationSystem = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    const generateNotifications = useCallback(async () => {
        try {
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
                });
            });

            // Active sessions
            const activeSessions = sessions
                .filter(session => session.status === "active")
                .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
                .slice(0, 3);

            activeSessions.forEach(session => {
                notifications.push({
                    id: `active-${session.session_id}`,
                    type: "active",
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
                    });
                }
            });

            // Revenue milestones (if any high-value sessions)
            const highValueSessions = recentCompletedSessions.filter(session => session.total_charge > 1000);
            highValueSessions.forEach(session => {
                notifications.push({
                    id: `revenue-${session.session_id}`,
                    type: "revenue",
                });
            });

            setUnreadCount(notifications.length);
        } catch (error) {
            console.error("Error generating notifications:", error);
        }
    }, []);

    useEffect(() => {
        generateNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(generateNotifications, 30000);
        return () => clearInterval(interval);
    }, [generateNotifications]);

    return (
        <div className="relative cursor-pointer">
            {/* Notification Bell */}
            <IoMdNotificationsOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </div>
    );
};

export default NotificationSystem;
