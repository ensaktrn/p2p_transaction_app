import { useState } from "react";
import axios from "axios";
import { Container, Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function AddCard({ token }) {
  const [card, setCard] = useState({ card_number: "", cvv: "", balance: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setCard({ ...card, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:4000/add-card", card, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Card added successfully!");
      navigate("/dashboard"); // Kart ekleyince Dashboard'a yönlendir
    } catch (error) {
      alert("Failed to add card");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="p-4 w-50">
        <h2 className="text-center">Add a New Card</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Control type="text" name="card_number" placeholder="Card Number" onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Control type="text" name="cvv" placeholder="CVV" onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Control type="number" name="balance" placeholder="Initial Balance" onChange={handleChange} required />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mt-2">
            Add Card
          </Button>
        </Form>
        <p className="text-center mt-2">
          <a href="/dashboard">Back to Dashboard</a>
        </p>
      </Card>
    </Container>
  );
}

export default AddCard;
