import { useState } from "react";

const AddCard = () => {
    const [cardNumber, setCardNumber] = useState("");
    const [holderName, setHolderName] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [balance, setBalance] = useState(0);
    const [message, setMessage] = useState("");

    const handleAddCard = async () => {
        setMessage("");

        if (!cardNumber || !holderName || !expiryDate || !cvv || !balance) {
            setMessage("All fields are required");
            return;
        }

        try {
            const response = await fetch("http://localhost:4000/add-card", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ cardNumber, holderName, expiryDate, cvv, balance }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Card added successfully");
                setCardNumber("");
                setHolderName("");
                setExpiryDate("");
                setCvv("");
                setBalance("");
                navigate("/dashboard");
            } else {
                setMessage(data.error || "Failed to add card");
            }

        } catch (error) {
            setMessage("Error connecting to server");
        }
    };

    return (
        <div className="container mt-4">
            <h2>Add a New Card</h2>
            <div className="mb-3">
                <label className="form-label">Card Number:</label>
                <input
                    type="text"
                    className="form-control"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength="16"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Cardholder Name:</label>
                <input
                    type="text"
                    className="form-control"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Expiry Date:</label>
                <input
                    type="date"
                    className="form-control"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">CVV:</label>
                <input
                    type="text"
                    className="form-control"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength="3"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Expiry Date:</label>
                <input
                    type="number"
                    className="form-control"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                />
            </div>
            <button className="btn btn-primary" onClick={handleAddCard}>
                Add Card
            </button>
            {message && <p className="mt-3">{message}</p>}
            <p className="text-center mt-2">
          <a href="/dashboard">Back to Dashboard</a>
        </p>
        </div>
    );
};

export default AddCard;
