import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Button, Form, Table, Row, Col } from "react-bootstrap";

function Dashboard({ token }) {
  const [cards, setCards] = useState([]);
  const [balance, setBalance] = useState(0);
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [cardCVV, setcardCVV] = useState("");

  useEffect(() => {
    fetchCards();
    fetchBalance();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await axios.get("http://localhost:4000/my-cards", { headers: { Authorization: `Bearer ${token}` } });
      setCards(res.data);
    } catch (error) {
      console.error("Error fetching cards", error);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await axios.get("http://localhost:5001/balance", { headers: { Authorization: `Bearer ${token}` } });
      setBalance(res.data.balance);
    } catch (error) {
      console.error("Error fetching balance", error);
    }
  };

  const handleTopup = async () => {
    try {
      await axios.post(
        "http://localhost:4000/top-up",
        { card_number: selectedCard, cvv: cardCVV, amount: Number(topupAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBalance();
      alert("Top-up successful!");
    } catch (error) {
      alert("Top-up failed!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const setCard = (card) => {
    setSelectedCard(card.card_number);
    setcardCVV(card.cvv);
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <h4>Account Balance</h4>
              <h2>${balance}</h2>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4>Top-up Balance</h4>
              <Form>
                <Form.Group>
                  <Form.Control
                    type="number"
                    placeholder="Enter amount"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                  />
                </Form.Group>
                <Button className="mt-2" variant="success" onClick={handleTopup} disabled={!selectedCard}>
                  Top-up
                </Button>
                
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <h4>Your Cards</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Card Number</th>
                    <th>CVV</th>
                    <th>Balance</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.card_number}>
                      <td>{card.card_number}</td>
                      <td>{card.cvv}</td>
                      <td>{card.balance}</td>
                      <td>
                        <Button variant="primary" onClick={() => setCard(card)} >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
                <Button variant="primary" className="mt-3 me-2" href="/add-card">
                Add Card
                </Button>
                <Button variant="secondary" className="mt-3" href="/profile">
                Update Profile
                </Button>
                <Button variant="danger" className="mt-3" onClick={handleLogout}>
                    Logout
                </Button>
            </Card.Body>
          </Card>
            
        </Col>
        
      </Row>
    </Container>
  );
}

export default Dashboard;
