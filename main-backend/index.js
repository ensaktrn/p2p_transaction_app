require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

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

app.listen(process.env.PORT, () => {
  console.log(`Main Backend running on port ${process.env.PORT}`);
});

// Kullanıcı tablosunu oluştur
const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      balance DECIMAL(10,2) DEFAULT 0
    );
  `);
  console.log("Users table is ready!");
};
createTables();

// Kullanıcı Kaydı (Register)
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
    );
    res.json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Güncellenmiş JWT Middleware: Kara Listeyi Kontrol Eder
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

// Kullanıcı Girişi (Login)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  // Kullanıcı Profilini Görüntüleme
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT username, balance FROM users WHERE id = $1", [req.user.id]);
  
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
  // Kullanıcı Şifresini Değiştirme
app.put("/change-password", authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
  
    try {
      const result = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
  
      const isMatch = await bcrypt.compare(oldPassword, result.rows[0].password);
      if (!isMatch) return res.status(400).json({ error: "Incorrect old password" });
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
  
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
const tokenBlacklist = new Set(); // Kara listeye alınan tokenlar

// Kullanıcı Çıkışı (Logout)
app.post("/logout", authenticateToken, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(400).json({ error: "No token provided" });

  tokenBlacklist.add(token);
  res.json({ message: "Logout successful" });
});

// Kullanıcının Bakiyesini Güncelle (Top-up işlemi sonrası)
app.post("/add-balance", authenticateToken, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, req.user.id]);

    res.json({ message: "Balance updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

