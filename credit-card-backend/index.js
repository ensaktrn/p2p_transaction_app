require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Kredi Kartı Tablosunu Oluştur
const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      card_number VARCHAR(16) UNIQUE NOT NULL,
      cardholder_name VARCHAR(100) NOT NULL,
      cvv VARCHAR(3) NOT NULL,
      balance DECIMAL(10,2) NOT NULL
    );
  `);
  console.log("Cards table is ready!");
};
createTables();

const tokenBlacklist = new Set();

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  if (tokenBlacklist.has(token)) return res.status(403).json({ error: "Token is invalid" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = user;
    next();
  });
};

// Kullanıcı Çıkışı (Logout)
app.post("/logout", authenticateToken, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(400).json({ error: "No token provided" });

  tokenBlacklist.add(token);
  res.json({ message: "Logout successful" });
});


// Kullanıcıya Ait Kartları Doğrulama
app.post("/validate-card", authenticateToken, async (req, res) => {
  const { card_number, cvv } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM cards WHERE card_number = $1 AND cvv = $2 AND user_id = $3",
      [card_number, cvv, req.user.id]
    );

    if (result.rows.length === 0) return res.status(400).json({ error: "Invalid card or not owned by user" });

    res.json({ message: "Card validated", card: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Credit Card Backend running on port ${process.env.PORT}`);
});

// Bakiye Yükleme (Top-up)
app.post("/top-up", async (req, res) => {
  const { card_number, cvv, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    // Kart doğrulama
    const cardResult = await pool.query(
      "SELECT * FROM cards WHERE card_number = $1 AND cvv = $2",
      [card_number, cvv]
    );

    if (cardResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid card" });
    }

    const card = cardResult.rows[0];

    // Kartın yeterli bakiyesi var mı?
    if (card.balance < amount) {
      return res.status(400).json({ error: "Insufficient card balance" });
    }

    // Kartın bakiyesini düşür
    await pool.query(
      "UPDATE cards SET balance = balance - $1 WHERE card_number = $2",
      [amount, card_number]
    );

    res.json({ message: "Balance topped up successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcının Sahip Olduğu Kartları Listeleme
app.get("/my-cards", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cards WHERE user_id = $1", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcıya Kredi Kartı Ekleme
app.post("/add-card", authenticateToken, async (req, res) => {
  const { card_number, cardholder_name, cvv, balance } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO cards (card_number, cardholder_name, cvv, balance, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [card_number, cardholder_name, cvv, balance, req.user.id]
    );
    res.json({ message: "Card added successfully", card: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
