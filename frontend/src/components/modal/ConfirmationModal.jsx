import React from "react";
import { MdWarning, MdClose } from "react-icons/md";

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning" // warning, error, info
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case "error":
                return <MdWarning className="text-red-500 text-3xl" />;
            case "info":
                return <MdWarning className="text-blue-500 text-3xl" />;
            default:
                return <MdWarning className="text-yellow-500 text-3xl" />;
        }
    };

    const getConfirmButtonStyle = () => {
        switch (type) {
            case "error":
                return "bg-red-500 hover:bg-red-600";
            case "info":
                return "bg-blue-500 hover:bg-blue-600";
            default:
                return "bg-yellow-500 hover:bg-yellow-600";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        {getIcon()}
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* Message */}
                <div className="mb-6">
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold transition-colors ${getConfirmButtonStyle()}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
