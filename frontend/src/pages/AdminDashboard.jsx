import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [balance, setBalance] = useState(0);
  const [newCard, setNewCard] = useState({ card_number: "", holder_name: "", expiry_date: "", cvv: "" });

  useEffect(() => {
    fetchUsers();
    fetchCards();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5001/admin/users");
    setUsers(res.data);
  };

  const fetchCards = async () => {
    const res = await axios.get("http://localhost:5001/admin/cards");
    setCards(res.data);
  };

  const addBalance = async (userId) => {
    await axios.post(`http://localhost:5001/admin/users/${userId}/balance`, { amount: balance });
    fetchUsers();
  };

  const addCard = async () => {
    await axios.post("http://localhost:5001/admin/cards", newCard);
    setNewCard({ card_number: "", holder_name: "", expiry_date: "", cvv: "" });
    fetchCards();
  };

  const deleteCard = async (cardId) => {
    await axios.delete(`http://localhost:5001/admin/cards/${cardId}`);
    fetchCards();
  };

  return (
    <div className="container">
      <h2 className="mt-4">Admin Paneli</h2>

      {/* Kullanıcılar */}
      <div>
        <h3>Kullanıcılar</h3>
        <ul className="list-group">
          {users.map((user) => (
            <li key={user.id} className="list-group-item">
              {user.name} ({user.email}) - Balance: ${user.balance}
              <input type="number" onChange={(e) => setBalance(e.target.value)} className="mx-2" />
              <button onClick={() => addBalance(user.id)} className="btn btn-success btn-sm">Bakiye Ekle</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Kartlar */}
      <div>
        <h3>Kartlar</h3>
        <ul className="list-group">
          {cards.map((card) => (
            <li key={card.id} className="list-group-item">
              {card.card_number} - {card.holder_name} 
              <button onClick={() => deleteCard(card.id)} className="btn btn-danger btn-sm mx-2">Sil</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Kart Ekle */}
      <div>
        <h3>Yeni Kart Ekle</h3>
        <input type="text" placeholder="Kart Numarası" onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value })} className="form-control mb-2" />
        <input type="text" placeholder="Kart Sahibi" onChange={(e) => setNewCard({ ...newCard, holder_name: e.target.value })} className="form-control mb-2" />
        <input type="text" placeholder="Son Kullanma Tarihi" onChange={(e) => setNewCard({ ...newCard, expiry_date: e.target.value })} className="form-control mb-2" />
        <input type="text" placeholder="CVV" onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })} className="form-control mb-2" />
        <button onClick={addCard} className="btn btn-primary">Kart Ekle</button>
      </div>
    </div>
  );
};

export default AdminDashboard;
