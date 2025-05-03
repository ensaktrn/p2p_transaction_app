import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Table, Button } from "react-bootstrap";

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5001/admin/transactions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions", err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this transaction?")) return;

    try {
      await axios.post(
        "http://localhost:5001/admin/delete-transaction",
        { transactionId: id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Transaction cancelled!");
      fetchTransactions();
    } catch (err) {
      alert("Failed to cancel transaction.");
      console.error(err);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3 className="mb-4 text-center">Transactions</h3>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.sender}</td>
                <td>{tx.recipient}</td>
                <td>${parseFloat(tx.amount).toFixed(2)}</td>
                <td>{new Date(tx.created_at).toLocaleString()}</td>
                <td>
                  <Button variant="danger" size="sm" onClick={() => handleCancel(tx.id)}>
                    Cancel
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
}

export default AdminTransactions;
