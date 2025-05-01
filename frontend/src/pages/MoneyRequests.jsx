import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const MoneyRequests = () => {
  const [searchParams] = useSearchParams();
  const prefilledUsername = searchParams.get("username") || "";
  const [username, setUsername] = useState(prefilledUsername);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5001/money-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests", error);
    }
  };

  const sendRequest = async () => {
    setMessage("");

    if (!username || !amount) {
      setMessage("Please enter all fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/request-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ recipientUsername: username, amount }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Money request sent!");
        setUsername("");
        setAmount("");
      } else {
        setMessage(data.error || "Request failed.");
      }
    } catch (error) {
      console.error("Request error", error);
      setMessage("Server error.");
    }
  };

  const respondRequest = async (requestId, action) => {
    try {
      const res = await fetch("http://localhost:5001/respond-money-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchRequests();
      } else {
        alert(data.error || "Error responding to request.");
      }
    } catch (error) {
      console.error("Error responding to request", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Request Money</h2>

      <input
        type="text"
        className="form-control my-2"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="number"
        className="form-control my-2"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button className="btn btn-primary" onClick={sendRequest}>
        Request
      </button>

      {message && <p className="mt-3">{message}</p>}

      {/* Gelen İstekler */}
      <div className="mt-5">
        <h4>Incoming Money Requests</h4>
        {requests.length === 0 ? (
          <p>No incoming requests.</p>
        ) : (
          <ul className="list-group">
            {requests.map((req) => (
              <li key={req.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>From: {req.sender_username} | Amount: ${req.amount}</span>
                <div>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => respondRequest(req.id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => respondRequest(req.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MoneyRequests;
