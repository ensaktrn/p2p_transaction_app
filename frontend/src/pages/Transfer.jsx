import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const Transfer = () => {
  const [searchParams] = useSearchParams();
  const prefilledUsername = searchParams.get("username") || "";
  const [recipientUsername, setRecipientUsername] = useState(prefilledUsername);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleTransfer = async () => {
    setMessage("");

    if (!recipientUsername || !amount) {
      setMessage("Please enter all fields.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ recipientUsername, amount }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Transfer successful!");
        setRecipientUsername("");
        setAmount("");
      } else {
        setMessage(data.error || "Transfer failed.");
      }
    } catch (error) {
      console.error("Transfer error", error);
      setMessage("Server error.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Send Money</h2>

      <input
        type="text"
        className="form-control my-2"
        placeholder="Recipient Username"
        value={recipientUsername}
        onChange={(e) => setRecipientUsername(e.target.value)}
      />
      <input
        type="number"
        className="form-control my-2"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button className="btn btn-success" onClick={handleTransfer}>
        Send
      </button>

      {message && <p className="mt-3">{message}</p>}
    </div>
  );
};

export default Transfer;
