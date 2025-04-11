import { useState } from "react";

const Transfer = () => {
    const [recipientId, setRecipientId] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");

    const handleTransfer = async () => {
        setMessage("");

        if (!recipientId || !amount || amount <= 0) {
            setMessage("Invalid recipient or amount");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ recipientId, amount }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Transaction successful");
                setRecipientId("");
                setAmount("");
            } else {
                setMessage(data.error || "Transaction failed");
            }

        } catch (error) {
            setMessage("Error processing transaction");
        }
    };

    return (
        <div className="container mt-4">
            <h2>Money Transfer</h2>
            <div className="mb-3">
                <label className="form-label">Recipient ID:</label>
                <input
                    type="text"
                    className="form-control"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Amount:</label>
                <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>
            <button className="btn btn-primary" onClick={handleTransfer}>
                Send Money
            </button>
            {message && <p className="mt-3">{message}</p>}
        </div>
    );
};

export default Transfer;
