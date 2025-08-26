import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [paymentDetails, setPaymentDetails] = useState(null);

    const verifyPayment = async (sessionId) => {
        try {
            console.log('Verifying payment for session:', sessionId);
            await axios.post('http://localhost:8000/session/verify-payment', {
                session_id: sessionId
            });
            console.log('✅ Payment verified successfully');
        } catch (error) {
            console.error('❌ Payment verification failed:', error);
        }
    };

    useEffect(() => {
        // Extract payment details from URL parameters
        const details = {
            payment_id: searchParams.get('razorpay_payment_id'),
            payment_link_id: searchParams.get('razorpay_payment_link_id'),
            payment_link_reference_id: searchParams.get('razorpay_payment_link_reference_id'),
            payment_status: searchParams.get('razorpay_payment_link_status'),
            signature: searchParams.get('razorpay_signature')
        };

        setPaymentDetails(details);

        // Extract session_id from the URL or localStorage
        const sessionId = sessionStorage.getItem('currentSessionId') || localStorage.getItem('currentSessionId');

        if (sessionId && isSuccess) {
            // Verify payment in backend
            verifyPayment(sessionId);
        }

        // Auto-close the window after showing success message for 2 seconds
        const timer = setTimeout(() => {
            if (window.opener) {
                // This is a popup window, close it and notify parent
                try {
                    console.log('Sending payment success message to parent window');
                    window.opener.postMessage({
                        type: 'PAYMENT_SUCCESS',
                        data: details
                    }, '*');

                    // Force close the window
                    window.close();
                } catch (error) {
                    console.error('Error communicating with parent window:', error);
                    window.close(); // Still try to close even if message fails
                }
            } else {
                // This is the main window, redirect to appropriate page
                console.log('No opener window found, redirecting to admin');
                window.location.href = '/admin';
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [searchParams]);

    if (!paymentDetails) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
                    <p className="text-lg text-gray-600">Processing payment details...</p>
                </div>
            </div>
        );
    }

    const isSuccess = paymentDetails.payment_status === 'paid';

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl bg-white p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-6">
                            {isSuccess ? '🎉' : '❌'}
                        </div>
                        <h1 className={`mb-4 text-3xl font-bold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                        </h1>
                        <p className="text-gray-600">
                            {isSuccess
                                ? 'Your payment has been processed successfully.'
                                : 'There was an issue processing your payment.'
                            }
                        </p>
                    </div>

                    {isSuccess && (
                        <div className="rounded-xl bg-green-50 p-6 mb-6">
                            <h2 className="mb-4 text-center text-lg font-bold text-green-800">
                                Payment Details
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium text-green-700">Payment ID:</span>
                                    <span className="text-green-800 font-mono text-xs">
                                        {paymentDetails.payment_id}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-green-700">Status:</span>
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                        ✅ {paymentDetails.payment_status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <div className="mb-4 rounded-lg bg-blue-50 p-4">
                            <p className="text-sm text-blue-700">
                                <strong>This window will close automatically in 3 seconds.</strong>
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                You'll be redirected back to the main application.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                if (window.opener) {
                                    window.opener.postMessage({
                                        type: 'PAYMENT_SUCCESS',
                                        data: paymentDetails
                                    }, '*');
                                    window.close();
                                } else {
                                    window.location.href = '/admin';
                                }
                            }}
                            className="w-full rounded-lg bg-blue-500 py-3 text-white hover:bg-blue-600 transition-colors font-medium"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
