import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Table } from "react-bootstrap";

function MerchantTransactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5001/merchant/transactions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Error loading transactions", err);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h4 className="text-center mb-4">Received Payments</h4>
        {transactions.length === 0 ? (
          <p className="text-center">No transactions found.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>From</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.sender}</td>
                  <td>${parseFloat(t.amount).toFixed(2)}</td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}

export default MerchantTransactions;
