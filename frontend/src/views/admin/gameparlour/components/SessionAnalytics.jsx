import React, { useState, useEffect } from "react";
import PieChart from "components/charts/PieChart";
import Card from "components/card";
import { api } from "../../../../services/authService";

const SessionAnalytics = () => {
    const [pieData, setPieData] = useState([]);
    const [pieOptions, setPieOptions] = useState({});
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        totalTables: 0,
        occupancyRate: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessionAnalytics();
        const interval = setInterval(fetchSessionAnalytics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchSessionAnalytics = async () => {
        try {
            const [sessionsResponse, tablesResponse] = await Promise.all([
                api.get("/admin/sessions"),
                api.get("/admin/tables"),
            ]);

            const sessions = sessionsResponse.data;
            const tables = tablesResponse.data;

            const activeSessions = sessions.filter(s => s.status === "active").length;
            const completedToday = sessions.filter(s => {
                if (s.status !== "completed") return false;
                const today = new Date().toDateString();
                const sessionDate = new Date(s.end_time).toDateString();
                return sessionDate === today;
            }).length;

            const totalTables = tables.length;
            const occupiedTables = activeSessions;
            const availableTables = totalTables - occupiedTables;
            const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

            setStats({
                active: activeSessions,
                completed: completedToday,
                totalTables,
                occupancyRate,
            });

            // Pie chart data for table occupancy
            setPieData([occupiedTables, availableTables]);
            setPieOptions({
                labels: ["Occupied Tables", "Available Tables"],
                colors: ["#4318FF", "#6AD2FF"],
                chart: { width: "50px" },
                states: { hover: { filter: { type: "none" } } },
                legend: { show: false },
                dataLabels: { enabled: false },
                hover: { mode: null },
                plotOptions: {
                    pie: {
                        expandOnClick: false,
                        donut: {
                            labels: { show: false },
                        },
                    },
                },
                fill: { colors: ["#4318FF", "#6AD2FF"] },
                tooltip: {
                    enabled: true,
                    theme: "dark",
                    style: { fontSize: "12px", backgroundColor: "#000000" },
                    y: {
                        formatter: (value) => `${value} tables`,
                    },
                },
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching session analytics:", error);
            setLoading(false);
        }
    };

    return (
        <Card extra="rounded-[20px] p-3">
            <div className="flex flex-row justify-between px-3 pt-2">
                <div>
                    <h4 className="text-lg font-bold text-navy-700 dark:text-white">
                        Table Occupancy
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Real-time table usage
                    </p>
                </div>
                <div className="mb-6 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-brand-500">
                            {stats.occupancyRate}%
                        </span>
                        <span className="text-xs text-gray-500">Occupied</span>
                    </div>
                </div>
            </div>

            <div className="mb-auto flex h-[220px] w-full items-center justify-center">
                {loading ? (
                    <div className="text-gray-500">Loading...</div>
                ) : (
                    <PieChart options={pieOptions} series={pieData} />
                )}
            </div>

            <div className="flex flex-row !justify-between rounded-2xl px-6 py-3 shadow-2xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-brand-500" />
                        <p className="ml-1 text-sm font-normal text-gray-600">Occupied</p>
                    </div>
                    <p className="mt-px text-xl font-bold text-navy-700 dark:text-white">
                        {stats.active}
                    </p>
                </div>

                <div className="h-11 w-px bg-gray-300 dark:bg-white/10" />

                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-[#6AD2FF]" />
                        <p className="ml-1 text-sm font-normal text-gray-600">Available</p>
                    </div>
                    <p className="mt-px text-xl font-bold text-navy-700 dark:text-white">
                        {stats.totalTables - stats.active}
                    </p>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 px-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-navy-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today's Sessions</p>
                    <p className="text-lg font-bold text-navy-700 dark:text-white">
                        {stats.completed}
                    </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-navy-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tables</p>
                    <p className="text-lg font-bold text-navy-700 dark:text-white">
                        {stats.totalTables}
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default SessionAnalytics;
