import { useState } from "react";
import { Container, Card, Form, Button } from "react-bootstrap";
import axios from "axios";

function AdminAddCard() {
  const [form, setForm] = useState({
    card_number: "",
    cvv: "",
    expiry_date: "",
    holder_name: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5001/admin/add-valid-card",
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage(res.data.message || "Card added successfully.");
      setForm({
        card_number: "",
        cvv: "",
        expiry_date: "",
        holder_name: "",
      });
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add card.");
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3 className="mb-4 text-center">Add Valid Card</h3>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              name="card_number"
              placeholder="Card Number"
              value={form.card_number}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              name="cvv"
              placeholder="CVV"
              value={form.cvv}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              name="expiry_date"
              placeholder="Expiry Date (MM/YY)"
              value={form.expiry_date}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Control
              type="text"
              name="holder_name"
              placeholder="Card Holder Name"
              value={form.holder_name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Button type="submit" variant="success" className="w-100">
            Add Card
          </Button>
        </Form>
        {message && <p className="text-center mt-3">{message}</p>}
      </Card>
    </Container>
  );
}

export default AdminAddCard;
