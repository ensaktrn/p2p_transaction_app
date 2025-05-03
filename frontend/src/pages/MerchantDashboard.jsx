import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Table, Button, Form } from "react-bootstrap";

function MerchantDashboard() {
  const [subscribers, setSubscribers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get("http://localhost:5001/merchant/subscribers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSubscribers(res.data);
    } catch (err) {
      console.error("Error fetching subscribers", err);
    }
  };

  const handleAmountChange = (userId, value) => {
    setAmounts({ ...amounts, [userId]: value });
  };

  const handleRequest = async (username, userId) => {
    const amount = amounts[userId];
    if (!amount || isNaN(amount)) return alert("Please enter a valid amount.");

    try {
      const res = await axios.post(
        "http://localhost:5001/merchant/request-payment",
        { username, amount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessage(res.data.message || "Request sent.");
      setAmounts({ ...amounts, [userId]: "" });
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send request.");
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3 className="mb-4 text-center">Merchant Dashboard</h3>
        <h5 className="mb-3">Your Subscribers</h5>

        {subscribers.length === 0 ? (
          <p>No subscribers yet.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Amount</th>
                <th>Request</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td>{s.username}</td>
                  <td>{s.full_name}</td>
                  <td>
                    <Form.Control
                      type="number"
                      value={amounts[s.id] || ""}
                      onChange={(e) => handleAmountChange(s.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRequest(s.username, s.id)}
                    >
                      Request Payment
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {message && <p className="mt-3 text-center">{message}</p>}
      </Card>
    </Container>
  );
}

export default MerchantDashboard;
