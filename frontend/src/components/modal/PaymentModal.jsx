import React, { useEffect, useState } from "react";
import { MdClose, MdError } from "react-icons/md";

const PaymentModal = ({ isOpen, onClose, paymentData, onPaymentSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    console.log('🎯 PaymentModal component rendered!');
    console.log('PaymentModal props:', { isOpen, hasPaymentData: !!paymentData, onClose: !!onClose });

    useEffect(() => {
        console.log('PaymentModal useEffect:', { isOpen, paymentData });
        if (isOpen && paymentData) {
            initializePayment();
        }
    }, [isOpen, paymentData]);

    const initializePayment = () => {
        if (!paymentData) {
            console.log('No payment data available');
            return;
        }

        console.log('Initializing payment with data:', paymentData);
        console.log('Has order_id:', !!paymentData.order_id);
        console.log('Has payment_link:', !!paymentData.payment_link);

        // Check if we have order_id (new method) or payment_link (fallback)
        if (paymentData.order_id) {
            console.log('Using Razorpay checkout overlay');
            // Use Razorpay checkout overlay
            initializeRazorpayCheckout();
        } else if (paymentData.payment_link) {
            console.log('Using payment link fallback');
            // Use iframe to embed the payment page
            initializePaymentLink();
        } else {
            console.log('No valid payment method found');
        }
    };

    const initializeRazorpayCheckout = () => {
        setLoading(true);

        // Load Razorpay checkout script if not already loaded
        if (!window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => openRazorpay();
            script.onerror = () => {
                setLoading(false);
                setError('Failed to load Razorpay. Please try again or pay at the counter.');
            };
            document.body.appendChild(script);
        } else {
            openRazorpay();
        }

        function openRazorpay() {
            const options = {
                key: paymentData.razorpay_key_id,
                amount: paymentData.amount,
                currency: paymentData.currency,
                name: 'Game Parlour',
                description: paymentData.description,
                order_id: paymentData.order_id,
                prefill: {
                    name: paymentData.customer_name,
                    email: paymentData.customer_email,
                },
                theme: {
                    color: '#3B82F6'
                },
                handler: function (response) {
                    // Payment successful
                    console.log('Payment successful:', response);
                    setLoading(false);
                    onPaymentSuccess(response);
                    onClose();
                },
                modal: {
                    ondismiss: function () {
                        // Payment cancelled or closed
                        setLoading(false);
                        onClose();
                    }
                }
            };

            try {
                const razorpay = new window.Razorpay(options);
                razorpay.open();
                setLoading(false);
            } catch (error) {
                console.error('Razorpay initialization error:', error);
                setLoading(false);
                setError('Payment initialization failed. Please try again.');
            }
        }
    };

    const initializePaymentLink = () => {
        // For payment links, we'll show the link in an iframe within our modal
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 text-lg">💳</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
                                    Payment
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Complete your payment securely
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <MdClose size={24} />
                        </button>
                    </div>

                    {loading && (
                        <div className="text-center py-8">
                            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
                            <p className="text-lg text-gray-600">Initializing payment...</p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
                            <div className="flex items-center space-x-3">
                                <MdError className="text-red-500 text-xl flex-shrink-0" />
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && paymentData && (
                        <div className="space-y-4">
                            {/* Payment Details */}
                            <div className="rounded-xl bg-gray-50 dark:bg-navy-900 p-4">
                                <h4 className="font-medium text-navy-700 dark:text-white mb-3">
                                    Payment Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                                        <span className="font-medium text-navy-700 dark:text-white">
                                            ₹{typeof paymentData.amount === 'number' ?
                                                (paymentData.amount > 1000 ? (paymentData.amount / 100).toFixed(2) : paymentData.amount.toFixed(2))
                                                : paymentData.amount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-300">Description:</span>
                                        <span className="font-medium text-navy-700 dark:text-white text-right">
                                            {paymentData.description || 'Gaming Session Payment'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Info */}
                            {paymentData.order_id ? (
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Razorpay Checkout</strong> will open with multiple payment options including UPI, Cards, Net Banking, and Wallets.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 p-4">
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        <strong>Payment Link Mode:</strong> You'll be redirected to Razorpay's secure payment page.
                                    </p>
                                    <div className="mt-3">
                                        <a
                                            href={paymentData.payment_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                                            onClick={() => {
                                                // Give it a moment then close the modal
                                                setTimeout(() => onClose(), 1000);
                                            }}
                                        >
                                            Open Payment Page →
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                {paymentData.order_id && !loading && (
                                    <button
                                        onClick={initializeRazorpayCheckout}
                                        className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                                    >
                                        Pay Now
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
