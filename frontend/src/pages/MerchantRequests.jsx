import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Table, Button, Row, Col } from "react-bootstrap";

function MerchantRequests() {
  const [requests, setRequests] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [subMessage, setSubMessage] = useState("");

  useEffect(() => {
    fetchRequests();
    fetchMerchants();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5001/merchant/requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await axios.get("http://localhost:5001/merchants", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMerchants(res.data);
    } catch (err) {
      console.error("Failed to fetch merchants", err);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      const res = await axios.post(
        "http://localhost:5001/merchant/handle-request",
        { requestId, action },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert(res.data.message);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
  };

  const handleSubscribe = async (merchantId) => {
    setSubMessage("");
    console.log("SUBSCRIBING TO:", merchantId);
    try {
      const res = await axios.post(
        "http://localhost:5001/subscribe-merchant",
        { merchantId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSubMessage(res.data.message);
    } catch (err) {
      setSubMessage(err.response?.data?.error || "Subscription failed.");
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        {/* Merchant List */}
        <Col md={6}>
          <Card className="p-4 mb-4">
            <h4 className="mb-3 text-center">Available Merchants</h4>
            {merchants.length === 0 ? (
              <p className="text-center">No merchants found.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Subscribe</th>
                  </tr>
                </thead>
                <tbody>
                {merchants.map((m) => (
                  <tr key={m.id}>
                    <td>{m.username}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubscribe(m.id)} // ✅ Doğru ID gönderiliyor mu?
                      >
                        Subscribe
                      </Button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </Table>
            )}
            {subMessage && <p className="text-center mt-2">{subMessage}</p>}
          </Card>
        </Col>

        {/* Incoming Requests */}
        <Col md={6}>
          <Card className="p-4">
            <h4 className="mb-3 text-center">Incoming Payment Requests</h4>
            {requests.length === 0 ? (
              <p className="text-center">No pending requests.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.merchant}</td>
                      <td>${parseFloat(r.amount).toFixed(2)}</td>
                      <td>
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleAction(r.id, "accept")}
                        >
                          Pay
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAction(r.id, "reject")}
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default MerchantRequests;
