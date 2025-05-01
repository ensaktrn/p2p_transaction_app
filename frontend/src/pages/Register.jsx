import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";

function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    phone: "",
    email: "",
    is_merchant: false,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5001/register", form);
      alert("Registration successful! Please login.");
      navigate("/");
    } catch (error) {
      alert("Registration failed");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="p-4 w-50">
        <h2 className="text-center">Register</h2>
        <Form onSubmit={handleRegister}>
          <Form.Group>
            <Form.Control
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Control
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Control
              type="text"
              name="full_name"
              placeholder="Full Name"
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Control
              type="text"
              name="phone"
              placeholder="Phone"
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Control
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
            />
          </Form.Group>

          {/* ✅ Merchant checkbox */}
          <Form.Group className="form-check mt-2">
            <Form.Check
              type="checkbox"
              label="Register as Merchant"
              name="is_merchant"
              checked={form.is_merchant}
              onChange={handleChange}
            />
          </Form.Group>

          <Button type="submit" variant="primary" className="w-100 mt-3">
            Register
          </Button>
        </Form>

        <p className="text-center mt-2">
          Already have an account? <a href="/">Login</a>
        </p>
      </Card>
    </Container>
  );
}

export default Register;
