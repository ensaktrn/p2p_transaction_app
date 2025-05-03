import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Card, Form, Button, Row, Col } from "react-bootstrap";

function SplitPayment() {
  const [amount, setAmount] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState("");

  // Tüm kullanıcıları çek
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5001/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAllUsers(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const handleCheckboxChange = (username) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!amount || selectedUsers.length === 0) {
      return setMessage("Please enter an amount and select users.");
    }

    try {
      const res = await axios.post(
        "http://localhost:5001/split-payment",
        {
          amount: parseFloat(amount).toFixed(2),
          participantUsernames: selectedUsers,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setMessage(res.data.message || "Split payment successful.");
      setAmount("");
      setSelectedUsers([]);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error processing payment.");
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3 className="text-center mb-4">Split Payment</h3>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="number"
              placeholder="Total amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Select participants:</Form.Label>
            <Row>
              {allUsers.map((user) => (
                <Col md={4} key={user.id}>
                  <Form.Check
                    type="checkbox"
                    label={user.username}
                    checked={selectedUsers.includes(user.username)}
                    onChange={() => handleCheckboxChange(user.username)}
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>

          <Button variant="primary" type="submit">
            Split
          </Button>
        </Form>
        {message && <p className="text-center mt-3">{message}</p>}
      </Card>
    </Container>
  );
}

export default SplitPayment;
