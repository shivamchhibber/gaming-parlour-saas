import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdPlayArrow, MdStop, MdAccessTime, MdAttachMoney, MdPayment, MdSkipNext } from "react-icons/md";
import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import authService from "services/authService";
import PaymentModal from "components/modal/PaymentModal";
import Toast from "components/notifications/Toast";
import ConfirmationModal from "components/modal/ConfirmationModal";

const GameSession = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const fetchSessionInfo = useCallback(async () => {
    try {
      const sessionResponse = await axios.get(buildApiUrl(`${API_ENDPOINTS.SESSION_DETAILS}/${sessionId}`));
      const sessionData = sessionResponse.data;

      if (sessionData.status === "completed") {
        // Session already ended, show bill
        const tableResponse = await axios.get(buildApiUrl(`${API_ENDPOINTS.TABLE_DETAILS}/${sessionData.table_id}`));
        setTable(tableResponse.data);
        setSession(sessionData);
        setBill({
          session_id: sessionData.session_id,
          user_name: sessionData.user_name,
          table_number: tableResponse.data.table_number,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
          duration_minutes: sessionData.duration_minutes,
          rate_per_hour: tableResponse.data.rate_per_hour,
          total_charge: sessionData.total_charge,
        });
      } else {
        // Active session
        const tableResponse = await axios.get(buildApiUrl(`${API_ENDPOINTS.TABLE_DETAILS}/${sessionData.table_id}`));
        setTable(tableResponse.data);
        setSession(sessionData);
      }
      setLoading(false);
    } catch (error) {
      setError("Session not found");
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionInfo();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchSessionInfo]);

  // Auto-check payment status when bill is displayed
  useEffect(() => {
    if (bill && bill.total_charge > 0) {
      const paymentCheckInterval = setInterval(() => {
        checkPaymentStatus();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(paymentCheckInterval);
    }
  }, [bill]);

  const handleEndSession = async () => {
    setEnding(true);
    try {
      const response = await axios.post(buildApiUrl(API_ENDPOINTS.SESSION_END), {
        session_id: sessionId,
      });
      setBill(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || "Error ending session");
      setEnding(false);
    }
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const diff = currentTime - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const calculateCurrentCharge = () => {
    if (!session || !table) return 0;
    const start = new Date(session.start_time);
    const diff = currentTime - start;
    const hours = diff / (1000 * 60 * 60);
    return (hours * table.rate_per_hour).toFixed(2);
  };

  const handlePayment = async () => {
    setPaymentLoading(true);

    try {
      // Store session ID for payment verification
      sessionStorage.setItem('currentSessionId', sessionId);

      // Create payment link via public backend endpoint
      const response = await axios.post(buildApiUrl(API_ENDPOINTS.PAYMENT_SESSION), {
        session_id: sessionId
      });

      console.log('Payment response:', response.data);
      console.log('Response keys:', Object.keys(response.data));
      console.log('Has order_id:', !!response.data.order_id);
      console.log('Has payment_link:', !!response.data.payment_link);

      // Set payment data and open modal regardless of format
      console.log('Setting payment data:', response.data);
      setPaymentData(response.data);
      console.log('Opening payment modal...');
      setShowPaymentModal(true);
      console.log('Modal state set to:', true);
      console.log('Current paymentData state:', response.data);
      setPaymentLoading(false);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentLoading(false);

      // Show error message
      if (error.response?.status === 404) {
        setToast({
          show: true,
          message: 'Session not found. Please contact staff for assistance.',
          type: 'error'
        });
      } else if (error.response?.status === 400) {
        setToast({
          show: true,
          message: 'Payment cannot be processed for this session. Please contact staff.',
          type: 'error'
        });
      } else {
        setToast({
          show: true,
          message: 'Payment service temporarily unavailable. Please pay at the counter.',
          type: 'error'
        });
      }
    }
  };

  const handlePaymentSuccess = (paymentResponse) => {
    console.log('Payment successful:', paymentResponse);

    // Check if player is logged in to redirect to dashboard
    const playerAuth = localStorage.getItem('playerAuth');
    if (playerAuth) {
      // Direct redirect to player dashboard (home screen)
      console.log('🎉 Payment confirmed by Razorpay - redirecting to dashboard');
      window.location.href = '/player/dashboard';
    } else {
      // For guest users, refresh to show payment completed
      console.log('🎉 Payment confirmed by Razorpay - refreshing page');
      window.location.reload();
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    // Check payment status after closing modal
    checkPaymentStatus();
  };

  const checkPaymentStatus = async () => {
    setCheckingPayment(true);
    try {
      const response = await axios.get(buildApiUrl(`${API_ENDPOINTS.SESSION_DETAILS}/${sessionId}`));
      const sessionData = response.data;

      // If payment status changed to paid, redirect immediately
      if (sessionData.payment_status === 'paid') {
        console.log('✅ Payment confirmed - redirecting to home screen');
        handlePaymentSuccess({ payment_status: 'paid' });
      } else {
        // Show toast if payment is still pending
        setToast({
          show: true,
          message: 'Payment is still pending. Please complete the payment or check again.',
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setToast({
        show: true,
        message: 'Failed to check payment status. Please try again.',
        type: 'error'
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleSkipPayment = () => {
    setShowConfirmModal(false);

    // Mark session as unpaid before closing
    axios.post(buildApiUrl(API_ENDPOINTS.SESSION_MARK_UNPAID), {
      session_id: sessionId
    }).catch(error => {
      console.error('Failed to mark session as unpaid:', error);
    }).finally(() => {
      // Try to close the tab/window
      if (window.opener) {
        window.close();
      } else {
        // If can't close, show message
        setToast({
          show: true,
          message: 'Please close this tab manually. Payment can still be made at the counter.',
          type: 'info'
        });
      }
    });
  };

  // Removed success modal - now using direct redirect

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="mb-4 text-2xl font-bold text-red-600">Error</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.href = "/admin"}
              className="w-full rounded-lg bg-blue-500 py-3 text-white hover:bg-blue-600"
            >
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bill) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Bill Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="mb-4 text-3xl font-bold text-green-600">
                Session Completed!
              </h1>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  💡 <strong>Quick Redirect:</strong> You'll be sent to your dashboard immediately after payment
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Razorpay will automatically redirect you to your home screen once payment is confirmed
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-6 mb-8">
              <h2 className="mb-6 text-center text-xl font-bold text-gray-800">
                📋 Session Bill
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">User:</span>
                  <span className="text-gray-800">{bill.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Table:</span>
                  <span className="text-gray-800">{bill.table_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Start Time:</span>
                  <span className="text-gray-800">
                    {new Date(bill.start_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">End Time:</span>
                  <span className="text-gray-800">
                    {new Date(bill.end_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Duration:</span>
                  <span className="text-gray-800">
                    {bill.duration_minutes} minutes
                    {bill.billing_minutes && bill.billing_minutes > bill.duration_minutes && (
                      <span className="text-sm text-gray-500 block">
                        (Billed for {bill.billing_minutes} min - minimum)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Rate:</span>
                  <span className="text-gray-800">₹{bill.rate_per_hour}/hour</span>
                </div>
                <hr className="my-4 border-gray-300" />
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-800">Total Amount:</span>
                  <span className="text-green-600">₹{bill.total_charge}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className={`w-full rounded-lg py-4 text-lg font-semibold text-white transition-colors ${paymentLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
                  }`}
              >
                {paymentLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </span>
                ) : (
                  `💳 Pay ₹${bill.total_charge} with Razorpay`
                )}
              </button>
              <div className="space-y-3">
                <button
                  onClick={checkPaymentStatus}
                  disabled={checkingPayment}
                  className={`w-full rounded-lg py-3 text-white transition-colors ${checkingPayment
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                  {checkingPayment ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Checking...
                    </span>
                  ) : (
                    '🔄 Check Payment Status'
                  )}
                </button>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full rounded-lg bg-gray-500 py-3 text-white hover:bg-gray-600 transition-colors"
                >
                  Skip Payment & Exit
                </button>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="mt-6 rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-3 text-lg font-bold text-gray-800 text-center">
              💡 Payment Options
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span><strong>Digital Payment:</strong> Click "Make Payment" for online payment via UPI, Cards, or Wallets</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-blue-500">💵</span>
                <span><strong>Cash Payment:</strong> You can also pay in cash at the counter</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-purple-500">📱</span>
                <span><strong>Receipt:</strong> Keep this screen for payment reference</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-gray-800 font-semibold">Thank you for playing! 🎮</p>
            </div>
          </div>

          {/* Debug Modal State */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg">
                <h2>Payment Modal Test</h2>
                <p>Modal is open: {showPaymentModal ? 'YES' : 'NO'}</p>
                <p>Has payment data: {paymentData ? 'YES' : 'NO'}</p>
                <button onClick={() => setShowPaymentModal(false)}>Close</button>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={handlePaymentClose}
            paymentData={paymentData}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Active Session Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-6">⏱️</div>
            <h1 className="mb-4 text-2xl font-bold text-blue-600">
              Gaming Session Active
            </h1>
            <p className="text-gray-600">
              Hello <strong>{session.user_name}</strong>! You're playing at Table{" "}
              <strong>{table.table_number}</strong>
            </p>
          </div>

          {/* Timer Display */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-8 mb-8 text-center">
            <div className="text-5xl font-bold text-blue-600 mb-4">
              {formatDuration(session.start_time)}
            </div>
            <p className="text-gray-600 mb-4">
              Session started at: {new Date(session.start_time).toLocaleTimeString()}
            </p>
            <p className="text-2xl font-bold text-green-600 mb-2">
              Current Charge: ₹{calculateCurrentCharge()}
            </p>
            <p className="text-sm text-gray-600">
              Rate: ₹{table.rate_per_hour}/hour
            </p>
          </div>

          <button
            onClick={handleEndSession}
            disabled={ending}
            className="w-full rounded-lg bg-red-500 py-4 text-lg font-semibold text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {ending ? "Ending Session..." : "End Session & Calculate Bill"}
          </button>
        </div>

        {/* Tips Card */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-bold text-gray-800">💡 Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              Your session time is being tracked automatically
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              Charges are calculated in real-time based on usage
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              Click "End Session" when you're done playing
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              You'll receive a detailed bill after ending the session
            </li>
          </ul>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          paymentData={paymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Toast Notifications */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        {/* Skip Payment Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSkipPayment}
          title="⚠️ Skip Payment Confirmation"
          message={`Total Amount: ₹${bill?.total_charge}\nThis session will be marked as unpaid.\n\nAre you sure you want to skip payment and exit?`}
          confirmText="Skip Payment"
          cancelText="Continue Payment"
          type="warning"
        />

        {/* Success Modal removed - using direct redirect */}
      </div>
    </div>
  );
};

export default GameSession;
