import React, { useState, useEffect } from "react";
import Card from "components/card";
import authService from "services/authService";

const OrganizationManagement = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        owner_name: "",
        owner_email: "",
        owner_phone: "",
    });

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const response = await authService.api.get("/super-admin/organizations");
            setOrganizations(response.data);
        } catch (error) {
            console.error("Error fetching organizations:", error);
            setMessage("Error fetching organizations");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAddOrganization = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.contact_email || !formData.owner_name || !formData.owner_email) {
            setMessage("Please fill in all required fields");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        try {
            await authService.api.post("/super-admin/organizations", formData);
            setMessage("Organization created successfully! Owner credentials have been generated.");
            setMessageType("success");
            setFormData({
                name: "",
                description: "",
                address: "",
                contact_email: "",
                contact_phone: "",
                owner_name: "",
                owner_email: "",
                owner_phone: "",
            });
            setShowAddForm(false);
            fetchOrganizations();
            setTimeout(() => setMessage(""), 5000);
        } catch (error) {
            console.error("Error creating organization:", error);
            setMessage(error.response?.data?.detail || "Error creating organization");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleWhitelist = async (orgId, orgName) => {
        if (window.confirm(`Are you sure you want to whitelist and activate "${orgName}"?`)) {
            try {
                await authService.api.post(`/super-admin/organizations/${orgId}/whitelist`);
                setMessage(`Organization "${orgName}" has been whitelisted and activated!`);
                setMessageType("success");
                fetchOrganizations();
                setTimeout(() => setMessage(""), 3000);
            } catch (error) {
                console.error("Error whitelisting organization:", error);
                setMessage("Error whitelisting organization");
                setMessageType("error");
                setTimeout(() => setMessage(""), 3000);
            }
        }
    };

    const getStatusBadge = (org) => {
        if (org.is_whitelisted && org.subscription_status === "active") {
            return (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    ✅ Active
                </span>
            );
        } else if (org.subscription_status === "pending") {
            return (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    ⏳ Pending Approval
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    ❌ Inactive
                </span>
            );
        }
    };

    if (loading) {
        return (
            <div className="mt-3 grid h-full grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
                    <Card extra="w-full h-full p-6">
                        <div className="text-center">Loading organizations...</div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 grid h-full grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
            <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
                {/* Header */}
                <Card extra="w-full h-full p-6 mb-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                                🏢 Organization Management
                            </h4>
                            <p className="mt-2 text-base text-gray-600">
                                Manage game parlour organizations and their subscriptions
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="linear rounded-xl bg-brand-500 px-4 py-2 text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
                        >
                            {showAddForm ? "Cancel" : "➕ Add Organization"}
                        </button>
                    </div>

                    {message && (
                        <div className={`mt-4 rounded-xl p-4 ${messageType === "success"
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}>
                            <p className={`text-sm ${messageType === "success" ? "text-green-600" : "text-red-600"
                                }`}>
                                {message}
                            </p>
                        </div>
                    )}
                </Card>

                {/* Add Organization Form */}
                {showAddForm && (
                    <Card extra="w-full h-full p-6 mb-5">
                        <h5 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
                            Create New Organization
                        </h5>
                        <form onSubmit={handleAddOrganization} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-navy-700 dark:text-white">
                                        Organization Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                        placeholder="GameZone Paradise"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-navy-700 dark:text-white">
                                        Contact Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                        placeholder="info@gamezoneparadise.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-navy-700 dark:text-white">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                    placeholder="Premium gaming parlour with latest games..."
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-navy-700 dark:text-white">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                    placeholder="123 Main Street, Gaming District, City"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-navy-700 dark:text-white">
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                    placeholder="+1-555-123-4567"
                                />
                            </div>

                            <div className="border-t pt-4">
                                <h6 className="text-md font-semibold text-navy-700 dark:text-white mb-3">
                                    👤 Organization Owner Details
                                </h6>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-navy-700 dark:text-white">
                                            Owner Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="owner_name"
                                            value={formData.owner_name}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                            placeholder="John Gaming"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-navy-700 dark:text-white">
                                            Owner Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="owner_email"
                                            value={formData.owner_email}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                            placeholder="john@gamezoneparadise.com"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-navy-700 dark:text-white">
                                        Owner Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="owner_phone"
                                        value={formData.owner_phone}
                                        onChange={handleInputChange}
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500"
                                        placeholder="+1-555-987-6543"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="rounded-xl bg-gray-200 px-4 py-2 text-base font-medium text-gray-700 transition duration-200 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="linear rounded-xl bg-brand-500 px-4 py-2 text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700"
                                >
                                    Create Organization
                                </button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Organizations List */}
                <Card extra="w-full h-full p-6">
                    <h5 className="text-lg font-bold text-navy-700 dark:text-white mb-4">
                        Organizations ({organizations.length})
                    </h5>

                    {organizations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No organizations created yet</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="mt-4 linear rounded-xl bg-brand-500 px-4 py-2 text-base font-medium text-white transition duration-200 hover:bg-brand-600"
                            >
                                Create First Organization
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {organizations.map((org) => (
                                <div key={org.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h6 className="text-lg font-semibold text-navy-700 dark:text-white">
                                                    {org.name}
                                                </h6>
                                                {getStatusBadge(org)}
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {org.subscription_plan.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                                                <div>📧 {org.contact_email}</div>
                                                <div>👤 {org.owner_name}</div>
                                                <div>📅 Created: {new Date(org.created_at).toLocaleDateString()}</div>
                                                <div>🎮 Tables: {org.max_tables} | 👥 Staff: {org.max_staff}</div>
                                            </div>

                                            {org.description && (
                                                <p className="mt-2 text-sm text-gray-600">{org.description}</p>
                                            )}

                                            {org.address && (
                                                <p className="mt-1 text-sm text-gray-500">📍 {org.address}</p>
                                            )}
                                        </div>

                                        <div className="ml-4">
                                            {!org.is_whitelisted && (
                                                <button
                                                    onClick={() => handleWhitelist(org.id, org.name)}
                                                    className="rounded-lg bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                                                >
                                                    ✅ Approve & Activate
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {!org.is_whitelisted && (
                                        <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                                            <p className="text-sm text-yellow-800">
                                                ⏳ <strong>Pending Approval:</strong> This organization is waiting for admin approval.
                                                Click "Approve & Activate" to allow them to use the platform.
                                            </p>
                                            <p className="text-xs text-yellow-600 mt-1">
                                                Owner login: <code>owner_{org.slug}</code> | Password: <code>temp123</code>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default OrganizationManagement;
