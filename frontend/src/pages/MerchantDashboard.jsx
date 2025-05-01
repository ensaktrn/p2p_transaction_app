import { useState, useEffect } from "react";
import { Container, Card, ListGroup } from "react-bootstrap";

function MerchantDashboard() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("http://localhost:5001/merchant-transactions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-3">
        <h2 className="text-center mb-4">Merchant Dashboard</h2>
        {transactions.length === 0 ? (
          <p>No incoming payments yet.</p>
        ) : (
          <ListGroup>
            {transactions.map((txn, idx) => (
              <ListGroup.Item key={idx}>
                From: {txn.sender_username} - Amount: ${txn.amount} - Date: {new Date(txn.created_at).toLocaleString()}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card>
    </Container>
  );
}

export default MerchantDashboard;
