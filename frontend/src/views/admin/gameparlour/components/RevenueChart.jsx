import React, { useState, useEffect } from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import { api } from "../../../../services/authService";
import { MdBarChart } from "react-icons/md";

const RevenueChart = () => {
    const [chartData, setChartData] = useState([]);
    const [chartOptions, setChartOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("weekly"); // weekly, monthly, daily

    useEffect(() => {
        fetchRevenueData();
    }, [period]);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            const sessionsResponse = await api.get("/admin/sessions");
            const sessions = sessionsResponse.data.filter(s => s.status === "completed" && s.total_charge > 0);

            let data, categories;

            if (period === "daily") {
                // Last 7 days
                data = getDailyRevenue(sessions);
                categories = getLast7Days();
            } else if (period === "weekly") {
                // Last 8 weeks
                data = getWeeklyRevenue(sessions);
                categories = getLast8Weeks();
            } else {
                // Last 6 months
                data = getMonthlyRevenue(sessions);
                categories = getLast6Months();
            }

            setChartData([
                {
                    name: "Revenue",
                    data: data,
                    color: "#4318FF",
                },
            ]);

            setChartOptions({
                chart: {
                    toolbar: { show: false },
                    type: "bar",
                },
                tooltip: {
                    style: { fontSize: "12px", backgroundColor: "#000000" },
                    theme: "dark",
                    y: {
                        formatter: (value) => `₹${value.toFixed(2)}`,
                    },
                },
                xaxis: {
                    categories,
                    labels: {
                        style: { colors: "#A3AED0", fontSize: "14px", fontWeight: "500" },
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                },
                yaxis: {
                    labels: {
                        style: { colors: "#A3AED0", fontSize: "14px" },
                        formatter: (value) => `₹${value}`,
                    },
                },
                grid: {
                    borderColor: "rgba(163, 174, 208, 0.3)",
                    yaxis: { lines: { show: true } },
                    xaxis: { lines: { show: false } },
                },
                fill: {
                    type: "gradient",
                    gradient: {
                        type: "vertical",
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.9,
                        colorStops: [
                            [
                                { offset: 0, color: "#4318FF", opacity: 1 },
                                { offset: 100, color: "rgba(67, 24, 255, 1)", opacity: 0.28 },
                            ],
                        ],
                    },
                },
                dataLabels: { enabled: false },
                plotOptions: {
                    bar: { borderRadius: 10, columnWidth: "60%" },
                },
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching revenue data:", error);
            setLoading(false);
        }
    };

    const getDailyRevenue = (sessions) => {
        const last7Days = getLast7Days();
        return last7Days.map(day => {
            const dayStart = new Date(day + " 00:00:00");
            const dayEnd = new Date(day + " 23:59:59");

            return sessions
                .filter(s => {
                    const sessionDate = new Date(s.end_time);
                    return sessionDate >= dayStart && sessionDate <= dayEnd;
                })
                .reduce((sum, s) => sum + (s.total_charge || 0), 0);
        });
    };

    const getWeeklyRevenue = (sessions) => {
        const weeks = getLast8Weeks();
        return weeks.map(week => {
            const [start, end] = week.split(' - ');
            const weekStart = new Date(start + " 00:00:00");
            const weekEnd = new Date(end + " 23:59:59");

            return sessions
                .filter(s => {
                    const sessionDate = new Date(s.end_time);
                    return sessionDate >= weekStart && sessionDate <= weekEnd;
                })
                .reduce((sum, s) => sum + (s.total_charge || 0), 0);
        });
    };

    const getMonthlyRevenue = (sessions) => {
        const months = getLast6Months();
        return months.map(month => {
            return sessions
                .filter(s => {
                    const sessionDate = new Date(s.end_time);
                    const sessionMonth = sessionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    return sessionMonth === month;
                })
                .reduce((sum, s) => sum + (s.total_charge || 0), 0);
        });
    };

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-CA')); // YYYY-MM-DD format
        }
        return days.map(d => d.split('-')[2]); // Return just day numbers
    };

    const getLast8Weeks = () => {
        const weeks = [];
        for (let i = 7; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            weeks.push(`${startDate.toLocaleDateString('en-CA')} - ${endDate.toLocaleDateString('en-CA')}`);
        }
        return weeks.map((_, index) => `W${index + 1}`);
    };

    const getLast6Months = () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }
        return months;
    };

    return (
        <Card extra="flex flex-col bg-white w-full rounded-3xl py-6 px-2 text-center">
            <div className="mb-auto flex items-center justify-between px-6">
                <h2 className="text-lg font-bold text-navy-700 dark:text-white">
                    Revenue Analytics
                </h2>
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-brand-500 focus:outline-none"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                    <button
                        onClick={fetchRevenueData}
                        className="!linear z-[1] flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 !transition !duration-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/10"
                    >
                        <MdBarChart className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <div className="md:mt-16 lg:mt-0">
                {loading ? (
                    <div className="flex h-[250px] items-center justify-center xl:h-[350px]">
                        <div className="text-gray-500">Loading revenue data...</div>
                    </div>
                ) : (
                    <div className="h-[250px] w-full xl:h-[350px]">
                        <BarChart chartData={chartData} chartOptions={chartOptions} />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default RevenueChart;
