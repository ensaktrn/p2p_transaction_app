import { useState, useEffect } from "react";
import { Container, Card, Form, Button, ListGroup } from "react-bootstrap";

function MoneyRequests() {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await fetch("http://localhost:5001/money-requests", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    setRequests(data);
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5001/money-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ username, amount }),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setUsername("");
    setAmount("");
  };

  const handleResponse = async (id, action) => {
    const res = await fetch("http://localhost:5001/money-request/respond", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ requestId: id, action }),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    fetchRequests();
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3>Request Money</h3>
        <Form onSubmit={sendRequest}>
          <Form.Control
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-2"
            required
          />
          <Form.Control
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mb-2"
            required
          />
          <Button type="submit" variant="primary" className="w-100">
            Send Request
          </Button>
        </Form>

        <hr />
        <h4>Incoming Requests</h4>
        {requests.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          <ListGroup>
            {requests.map((r) => (
              <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                <span>{r.sender_username} requested ${r.amount}</span>
                <div>
                  <Button variant="success" size="sm" className="me-2" onClick={() => handleResponse(r.id, "accept")}>
                    Accept
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleResponse(r.id, "reject")}>
                    Reject
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        {message && <p className="mt-3 text-center">{message}</p>}
      </Card>
    </Container>
  );
}

export default MoneyRequests;
