import React, { useEffect } from "react";
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from "react-icons/md";

const Toast = ({ message, type = "info", isVisible, onClose, duration = 4000 }) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case "success":
                return <MdCheckCircle className="text-green-500 text-xl" />;
            case "error":
                return <MdError className="text-red-500 text-xl" />;
            case "warning":
                return <MdWarning className="text-yellow-500 text-xl" />;
            default:
                return <MdInfo className="text-blue-500 text-xl" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case "success":
                return "border-green-200 bg-green-50";
            case "error":
                return "border-red-200 bg-red-50";
            case "warning":
                return "border-yellow-200 bg-yellow-50";
            default:
                return "border-blue-200 bg-blue-50";
        }
    };

    return (
        <div className="fixed top-20 right-4 z-[100] animate-slide-in">
            <div className={`max-w-xs sm:max-w-sm rounded-lg border ${getBorderColor()} p-4 shadow-lg`}>
                <div className="flex items-start space-x-3">
                    {getIcon()}
                    <div className="flex-1">
                        <p className="text-sm text-gray-800 font-medium whitespace-pre-line">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <MdClose className="text-lg" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
