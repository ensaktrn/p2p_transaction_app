import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import { Toast, ToastContainer } from "react-bootstrap";


function PayMerchant() {
  const [searchParams] = useSearchParams();
  const prefilledUsername = searchParams.get("username") || "";
  const [merchantUsername, setMerchantUsername] = useState(prefilledUsername);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const handlePayment = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:5001/pay-merchant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ merchantUsername, amount }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Payment successful!");
        setMerchantUsername("");
        setAmount("");
        setShowToast(true);
        setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
      } else {
        setMessage(data.error || "Payment failed.");
      }
    } catch (error) {
      console.error("Payment error", error);
      setMessage("Server error.");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="p-4 w-50">
        <h2 className="text-center">Pay Merchant</h2>
        <Form onSubmit={handlePayment}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              name="merchantUsername"
              placeholder="Merchant Username"
              value={merchantUsername}
              onChange={(e) => setMerchantUsername(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              type="number"
              name="amount"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100">
            Pay
          </Button>
        </Form>

        {message && <p className="text-center mt-3">{message}</p>}
      </Card>
      <ToastContainer position="top-center" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg="success">
            <Toast.Body className="text-white text-center">Payment successful!</Toast.Body>
        </Toast>
        </ToastContainer>
    </Container>
    
  );
}

export default PayMerchant;
