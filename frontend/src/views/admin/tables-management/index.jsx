import React, { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdDownload, MdQrCode } from "react-icons/md";
import { api } from "../../../services/authService";

import Card from "components/card";
import InputField from "components/fields/InputField";
import ConfirmationModal from "components/modal/ConfirmationModal";
import Toast from "components/notifications/Toast";

const TablesManagement = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        table_number: "",
        rate_per_hour: "",
    });
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await api.get("/admin/tables");
            setTables(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching tables:", error);
            setLoading(false);
        }
    };

    const handleAddTable = async (e) => {
        e.preventDefault();

        console.log("Form submission - formData:", formData); // Debug log

        // Validate form data
        if (!formData.table_number || !formData.table_number.trim()) {
            console.log("Validation failed: table_number is empty"); // Debug log
            setMessage("Table number is required");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        if (!formData.rate_per_hour || parseFloat(formData.rate_per_hour) <= 0) {
            setMessage("Valid rate per hour is required");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        try {
            const requestData = {
                table_number: formData.table_number.trim(),
                rate_per_hour: parseFloat(formData.rate_per_hour),
            };

            console.log("Sending data:", requestData); // Debug log

            await api.post("/admin/tables", requestData);

            setMessage("Table added successfully!");
            setMessageType("success");
            setFormData({ table_number: "", rate_per_hour: "" });
            setShowAddForm(false);
            fetchTables();
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error adding table:", error.response?.data); // Debug log
            setMessage(error.response?.data?.detail || "Error adding table");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleDeleteTable = (table) => {
        setTableToDelete(table);
        setShowDeleteModal(true);
    };

    const confirmDeleteTable = async () => {
        setShowDeleteModal(false);
        try {
            await api.delete(`/admin/tables/${tableToDelete.id}`);
            setToast({
                show: true,
                message: "Table deleted successfully!",
                type: "success"
            });
            fetchTables();
        } catch (error) {
            setToast({
                show: true,
                message: error.response?.data?.detail || "Error deleting table",
                type: "error"
            });
        }
        setTableToDelete(null);
    };

    const downloadQRCode = (table) => {
        const link = document.createElement("a");
        link.download = `table-${table.table_number}-qr.png`;
        link.href = table.qr_code;
        link.click();
    };

    const handleInputChange = (e) => {
        console.log("Input change:", e.target.name, "=", e.target.value); // Debug log
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-lg text-gray-600">Loading tables...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
                        🏓 Tables Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage gaming tables, set rates, and generate QR codes
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        // Reset form when opening
                        if (!showAddForm) {
                            setFormData({ table_number: "", rate_per_hour: "" });
                            setMessage("");
                        }
                    }}
                    className="flex items-center rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
                >
                    <MdAdd className="mr-2 h-5 w-5" />
                    Add New Table
                </button>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div
                    className={`mb-5 rounded-lg p-4 ${messageType === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                >
                    {message}
                </div>
            )}

            {/* Add Table Form */}
            {showAddForm && (
                <Card extra="mb-5">
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
                            Add New Gaming Table
                        </h3>
                        <form onSubmit={handleAddTable}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <InputField
                                    label="Table Number"
                                    placeholder="e.g., T001"
                                    name="table_number"
                                    value={formData.table_number}
                                    onChange={handleInputChange}
                                    required
                                />
                                <InputField
                                    label="Rate per Hour (₹)"
                                    placeholder="e.g., 100"
                                    name="rate_per_hour"
                                    type="number"
                                    step="0.01"
                                    value={formData.rate_per_hour}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="rounded-lg bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
                                >
                                    Add Table
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="rounded-lg bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </Card>
            )}

            {/* Tables Grid */}
            {tables.length === 0 ? (
                <Card>
                    <div className="p-8 text-center">
                        <MdQrCode className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                        <h3 className="mb-2 text-lg font-semibold text-gray-600">
                            No tables found
                        </h3>
                        <p className="mb-4 text-gray-500">
                            Add your first gaming table to get started
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="rounded-lg bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
                        >
                            Add Your First Table
                        </button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {tables.map((table) => (
                        <Card key={table.id} extra="p-6">
                            <div className="text-center">
                                {/* Table Header */}
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-navy-700 dark:text-white">
                                        Table {table.table_number}
                                    </h3>
                                    <p className="text-lg font-semibold text-brand-500">
                                        ₹{table.rate_per_hour}/hour
                                    </p>
                                </div>

                                {/* QR Code */}
                                <div className="mb-4">
                                    <img
                                        src={table.qr_code}
                                        alt={`QR Code for Table ${table.table_number}`}
                                        className="mx-auto h-32 w-32 rounded-lg border-2 border-gray-200"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => downloadQRCode(table)}
                                        className="flex items-center rounded-lg bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
                                    >
                                        <MdDownload className="mr-1 h-4 w-4" />
                                        Download QR
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTable(table)}
                                        className="flex items-center rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
                                    >
                                        <MdDelete className="mr-1 h-4 w-4" />
                                        Delete
                                    </button>
                                </div>

                                {/* Table Info */}
                                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-navy-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>Table ID:</strong> {table.id}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>QR URL:</strong> localhost:3000/scan/{table.id}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <Card extra="mt-8">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
                        📋 How to Use
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center">
                            <div className="mb-2 text-3xl">1️⃣</div>
                            <h4 className="font-semibold">Create Table</h4>
                            <p className="text-sm text-gray-600">Add table number and hourly rate</p>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl">2️⃣</div>
                            <h4 className="font-semibold">Download QR</h4>
                            <p className="text-sm text-gray-600">Print and place QR code on table</p>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl">3️⃣</div>
                            <h4 className="font-semibold">Users Scan</h4>
                            <p className="text-sm text-gray-600">Customers scan to start sessions</p>
                        </div>
                        <div className="text-center">
                            <div className="mb-2 text-3xl">4️⃣</div>
                            <h4 className="font-semibold">Auto Billing</h4>
                            <p className="text-sm text-gray-600">System calculates charges automatically</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setTableToDelete(null);
                }}
                onConfirm={confirmDeleteTable}
                title="Delete Table"
                message={`Are you sure you want to delete Table ${tableToDelete?.table_number}?\n\nThis action cannot be undone and will remove all associated QR codes.`}
                confirmText="Delete Table"
                cancelText="Cancel"
                type="error"
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

export default TablesManagement;
