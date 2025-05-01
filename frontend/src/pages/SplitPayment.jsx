import { useState, useEffect } from "react";
import { Container, Card, Form, Button, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function SplitPayment() {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

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
  
  

  const toggleFriend = (username) => {
    if (selectedFriends.includes(username)) {
      setSelectedFriends(selectedFriends.filter((u) => u !== username));
    } else {
      setSelectedFriends([...selectedFriends, username]);
    }
  };

  const handleSplitRequest = async () => {
    if (selectedFriends.length === 0 || !totalAmount) {
      setMessage("Please select friends and enter an amount.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/split-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recipients: selectedFriends,
          totalAmount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Split request sent successfully!");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setMessage(data.error || "Request failed.");
      }
    } catch (error) {
      console.error("Split request error", error);
      setMessage("Server error.");
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-3">
        <h2 className="text-center mb-4">Split Payment</h2>

        <Form.Group className="mb-3">
          <Form.Control
            type="number"
            placeholder="Total Amount"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            required
          />
        </Form.Group>

        <h5>Select Friends:</h5>
        <ListGroup className="mb-3">
          {friends.map((f, idx) => (
            <ListGroup.Item
              key={idx}
              className="d-flex justify-content-between align-items-center"
              onClick={() => toggleFriend(f.username)}
              active={selectedFriends.includes(f.username)}
              style={{ cursor: "pointer" }}
            >
              {f.username}
            </ListGroup.Item>
          ))}
        </ListGroup>

        <Button variant="primary" className="w-100" onClick={handleSplitRequest}>
          Send Split Request
        </Button>

        {message && <p className="text-center mt-3">{message}</p>}
      </Card>
    </Container>
  );
}

export default SplitPayment;
