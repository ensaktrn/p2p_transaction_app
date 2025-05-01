import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FriendsPage = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncomingRequests();
    fetchFriends();
  }, []);

  const fetchIncomingRequests = async () => {
    try {
      const res = await fetch("http://localhost:5001/friend-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setIncomingRequests(data);
    } catch (error) {
      console.error("Error fetching incoming requests", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("http://localhost:5001/friends-list", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setFriends(data);
    } catch (error) {
      console.error("Error fetching friends", error);
    }
  };

  const sendFriendRequest = async () => {
    setMessage("");

    if (!friendUsername) {
      setMessage("Please enter a username.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/send-friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ recipientUsername: friendUsername }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Friend request sent!");
        setFriendUsername("");
      } else {
        setMessage(data.error || "Error sending friend request.");
      }
    } catch (error) {
      console.error("Error sending friend request", error);
      setMessage("Server error.");
    }
  };

  const respondRequest = async (requestId, action) => {
    try {
      const res = await fetch("http://localhost:5001/respond-friend-request", {
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
        fetchIncomingRequests(); // Listeyi güncelle
        fetchFriends(); // Arkadaş listesini de güncelle
      } else {
        alert(data.error || "Error processing request.");
      }
    } catch (error) {
      console.error("Error responding to request", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Friends</h2>

      {/* Yeni Arkadaş İsteği Gönder */}
      <div className="mb-4">
        <h4>Send Friend Request</h4>
        <input
          type="text"
          className="form-control my-2"
          placeholder="Enter username"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
        />
        <button className="btn btn-primary" onClick={sendFriendRequest}>
          Send Request
        </button>
        {message && <p className="mt-2">{message}</p>}
      </div>

      {/* Gelen İstekler */}
      <div className="mb-5">
        <h4>Incoming Friend Requests</h4>
        {incomingRequests.length === 0 ? (
          <p>No incoming requests.</p>
        ) : (
          <ul className="list-group">
            {incomingRequests.map((req) => (
              <li key={req.id} className="list-group-item d-flex justify-content-between align-items-center">
                {req.sender_username}
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

      {/* Arkadaşlar Listesi */}
      <div>
        <h4>Your Friends</h4>
        {friends.length === 0 ? (
          <p>No friends yet.</p>
        ) : (
          <ul className="list-group">
            {friends.map((f, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                {f.username}
                <div>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => navigate(`/transfer?username=${f.username}`)}
                  >
                    Send Money
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/requests?username=${f.username}`)}
                  >
                    Request Money
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

export default FriendsPage;
