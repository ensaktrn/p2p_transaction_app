import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, ListGroup } from "react-bootstrap";

const MerchantList = () => {
  const [merchants, setMerchants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await fetch("http://localhost:5001/merchants", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setMerchants(data);
    } catch (error) {
      console.error("Error fetching merchants", error);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-3">
        <h2 className="text-center mb-4">Merchant List</h2>

        {merchants.length === 0 ? (
          <p>No merchants available.</p>
        ) : (
          <ListGroup>
            {merchants.map((merchant, idx) => (
              <ListGroup.Item
                key={idx}
                className="d-flex justify-content-between align-items-center"
              >
                {merchant.username}
                <Button
                  variant="success"
                  onClick={() => navigate(`/pay-merchant?username=${merchant.username}`)}
                >
                  Pay
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card>
    </Container>
  );
};

export default MerchantList;
