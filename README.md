# 💸 P2P Microtransactions Platform

This web application is a peer-to-peer (P2P) payment system inspired by platforms like Bizum and PayPal. It allows users to register, manage accounts, transfer money, request funds, and interact with merchants. Admins can manage users and validate cards.

---

## 🚀 Features

### 👤 Users
- Register and login
- Add and manage credit cards
- Top up balance using linked cards
- View and update profile
- Transfer money to other users
- Request money from other users
- Accept or reject incoming requests
- Manage friend list
- Use split payments across multiple participants
- View full transaction history
- Subscribe to merchants

### 🏪 Merchants
- View subscriber list
- Request payments from subscribers
- See merchant transaction history

### ⚙️ Admins
- View all users
- Edit user data (name, email, balance, admin rights)
- Add valid (test) cards
- Cancel transactions

---

## 📂 Project Structure

```
p2p-app/
│
├── main-backend/          # Node.js Express backend for core features
│   ├── index.js           # Main server file
│   ├── .env               # Environment variables for DB + JWT
│   └── routes/            # Optional route handlers
│
├── credit-card-backend/   # Backend for fake card processing
│   ├── index.js
│   └── .env
│
├── frontend/              # React frontend
│   ├── App.jsx
│   ├── pages/             # Login, Register, Dashboard, etc.
│   └── components/        # Navbar, reusable components
│
└── docs/                  # API Dictionary, Installation Manual, User Guide
```

---

## ⚙️ Installation

Full instructions can be found in `Installation_Manual.docx`

Basic steps:

```bash
# Clone and install
git clone https://github.com/yourusername/p2p-app.git
cd main-backend
npm install

# Create .env file
# DB_USER=p2p_user ...

# Create DB and tables
createdb p2p_payments
psql -d p2p_payments -f create_tables_p2p.sql

# Start backend
npm start
```

---

## 📚 Documentation

All documentation is located in the `docs/` folder:

- 📘 `API_Dictionary_FULL_P2P.docx`
- 📄 `User_Guide_P2P_Microtransactions.docx`
- 🛠️ `Installation_Manual_P2P_Microtransactions.docx`
- 📊 Content / Navigation / Presentation diagrams

---

## 👨‍💻 Technologies

- Node.js + Express  
- PostgreSQL  
- React.js  
- Bootstrap  
- JWT for authentication  

---

