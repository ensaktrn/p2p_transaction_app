import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Table } from "react-bootstrap";

function MerchantRequestHistory() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5001/merchant/request-history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load request history", err);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h4 className="mb-3 text-center">Payment Request History</h4>
        {requests.length === 0 ? (
          <p className="text-center">No requests found.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.username}</td>
                  <td>${parseFloat(r.amount).toFixed(2)}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}

export default MerchantRequestHistory;
