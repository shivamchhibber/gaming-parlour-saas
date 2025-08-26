import React, { useEffect } from "react";
import { MdCheckCircle, MdDashboard, MdRefresh } from "react-icons/md";

const SuccessModal = ({
    isOpen,
    onClose,
    onRedirect,
    title = "Success!",
    message,
    redirectText = "Continue",
    showRedirect = true,
    autoRedirect = false,
    autoRedirectDelay = 3000
}) => {
    useEffect(() => {
        if (isOpen && autoRedirect && autoRedirectDelay > 0) {
            const timer = setTimeout(() => {
                onRedirect();
            }, autoRedirectDelay);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoRedirect, autoRedirectDelay, onRedirect]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                {/* Success Icon */}
                <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <MdCheckCircle className="text-green-500 text-3xl" />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>

                {/* Message */}
                <div className="mb-6">
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    {showRedirect && (
                        <button
                            onClick={onRedirect}
                            className="w-full py-3 px-4 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                        >
                            <MdDashboard className="text-lg" />
                            <span>{redirectText}</span>
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                        <MdRefresh className="text-lg" />
                        <span>Stay Here</span>
                    </button>
                </div>

                {autoRedirect && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Automatically redirecting in {Math.ceil(autoRedirectDelay / 1000)} seconds...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuccessModal;
