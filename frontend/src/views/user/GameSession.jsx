import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const GameSession = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");

  const fetchSessionInfo = useCallback(async () => {
    try {
      const sessionResponse = await axios.get(`http://localhost:8000/session/${sessionId}`);
      const sessionData = sessionResponse.data;

      if (sessionData.status === "completed") {
        // Session already ended, show bill
        const tableResponse = await axios.get(`http://localhost:8000/table/${sessionData.table_id}`);
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
        const tableResponse = await axios.get(`http://localhost:8000/table/${sessionData.table_id}`);
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

  const handleEndSession = async () => {
    setEnding(true);
    try {
      const response = await axios.post("http://localhost:8000/session/end", {
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
                  <span className="text-gray-800">{bill.duration_minutes} minutes</span>
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
                onClick={() => {
                  // Simulate payment process
                  const paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Digital Wallet'];
                  const selectedMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

                  if (window.confirm(`Proceed with payment of ₹${bill.total_charge} via ${selectedMethod}?\n\n(This is a demo - no actual payment will be processed)`)) {
                    // Simulate payment processing
                    alert(`🎉 Payment Successful!\n\n✓ Amount: ₹${bill.total_charge}\n✓ Method: ${selectedMethod}\n✓ Transaction ID: TXN${Date.now()}\n\nThank you for your payment!`);

                    // In a real system, you would:
                    // 1. Call payment gateway API (Razorpay, Stripe, etc.)
                    // 2. Update session status in backend
                    // 3. Send SMS/email receipt
                    // 4. Redirect to success page
                  }
                }}
                className="w-full rounded-lg bg-green-500 py-4 text-lg font-semibold text-white hover:bg-green-600 transition-colors"
              >
                💳 Make Payment - ₹{bill.total_charge}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to skip payment and exit?')) {
                    // In a real system, you might want to mark this session as unpaid
                    window.close(); // Try to close the tab/window
                  }
                }}
                className="w-full rounded-lg bg-gray-500 py-3 text-white hover:bg-gray-600 transition-colors"
              >
                Skip Payment & Exit
              </button>
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
      </div>
    </div>
  );
};

export default GameSession;
