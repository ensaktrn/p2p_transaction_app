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
      balance DECIMAL(10,2) NOT NULL,
      user_id INT REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log("Cards table is ready!");
};
createTables();

// JWT Token Doğrulama Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = user;
    next();
  });
};

app.get("/my-cards", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cards WHERE user_id = $1", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Kart ekleme
app.post("/add-card",authenticateToken, async (req, res) => {
  const { cardNumber, holderName, expiryDate, cvv, balance } = req.body;
  const userId = req.user.id;

    try {
        // Check if the card exists in valid_cards
        const validCard = await pool.query(
            "SELECT * FROM valid_cards WHERE card_number = $1 AND holder_name = $2 AND expiry_date = $3 AND cvv = $4",
            [cardNumber, holderName, expiryDate, cvv]
        );

        if (validCard.rows.length === 0) {
            return res.status(400).json({ error: "Invalid card details" });
        }

        // If valid, add to user's cards
        await pool.query(
            "INSERT INTO cards (card_number, holder_name, expiry_date, cvv, user_id, balance) VALUES ($1, $2, $3, $4, $5, $6)",
            [cardNumber, holderName, expiryDate, cvv, userId, balance]
        );

        res.json({ message: "Card added successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/top-up", authenticateToken, async (req, res) => {
  const { card_number, cvv, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    // Kart doğrulama ve bakiyesini kontrol et
    const cardResult = await pool.query(
      "SELECT * FROM cards WHERE card_number = $1 AND cvv = $2 AND user_id = $3",
      [card_number, cvv, req.user.id]
    );

    if (cardResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid card or not owned by user" });
    }

    const card = cardResult.rows[0];

    if (card.balance < amount) {
      return res.status(400).json({ error: "Insufficient card balance" });
    }

    // Transaction başlat
    await pool.query("BEGIN");

    // Karttan bakiyeyi düş
    await pool.query("UPDATE cards SET balance = balance - $1 WHERE card_number = $2", [amount, card_number]);

    // Kullanıcının bakiyesini artır
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, req.user.id]);

    // İşlem başarılıysa commit et
    await pool.query("COMMIT");

    res.json({ message: "Balance topped up successfully" });
  } catch (err) {
    await pool.query("ROLLBACK"); // Hata olursa geri al
    res.status(500).json({ error: err.message });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Credit Card Backend running on port ${process.env.PORT}`);
});
