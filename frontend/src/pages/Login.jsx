import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";

function Login({ setToken }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5001/login", form);
      const token = res.data.token;
      localStorage.setItem("token", token);
      setToken(token);
  
      const meRes = await axios.get("http://localhost:5001/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const isAdmin = meRes.data.is_admin;
      const isMerchant = meRes.data.is_merchant;
      if (isAdmin) {
        window.location.href = "/admin-dashboard";
      }
        else if (isMerchant) {
        window.location.href = "/merchant-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
  
    } catch (error) {
      alert("Login failed");
    }
  };
  

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="p-4 w-50">
        <h2 className="text-center">Login</h2>
        <Form onSubmit={handleLogin}>
          <Form.Group>
            <Form.Control type="text" name="username" placeholder="Username" onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Control type="password" name="password" placeholder="Password" onChange={handleChange} required />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mt-2">Login</Button>
        </Form>
        <p className="text-center mt-2">Don't have an account? <a href="/register">Sign up</a></p>
      </Card>
    </Container>
  );
}

export default Login;
