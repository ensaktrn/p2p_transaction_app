require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
const router = express.Router();
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
  const { username, password, full_name, phone, email } = req.body;

  try {
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı ekle
    const result = await pool.query(
      "INSERT INTO users (username, password, full_name, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [username, hashedPassword, full_name, phone, email]
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

// **🔒 Admin Girişi**
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== "admin" || password !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: "Yetkisiz giriş!" });
  }
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// **📌 Tüm Kullanıcıları Listele**
router.get("/admin/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});

// **📌 Kullanıcıya Bakiye Ekleme**
router.post("/admin/users/:id/balance", async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Geçersiz miktar" });
  }

  try {
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, id]);
    res.json({ message: "Bakiye eklendi!" });
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});

// **📌 Tüm Kartları Listele**
router.get("/admin/cards", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cards");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});

// **📌 Yeni Kart Ekleme**
router.post("/admin/cards", async (req, res) => {
  const { card_number, holder_name, expiry_date, cvv } = req.body;
  if (!card_number || !holder_name || !expiry_date || !cvv) {
    return res.status(400).json({ error: "Eksik kart bilgileri" });
  }

  try {
    await pool.query(
      "INSERT INTO cards (card_number, holder_name, expiry_date, cvv) VALUES ($1, $2, $3, $4)",
      [card_number, holder_name, expiry_date, cvv]
    );
    res.json({ message: "Kart eklendi!" });
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});

// **📌 Kart Silme**
router.delete("/admin/cards/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM cards WHERE id = $1", [id]);
    res.json({ message: "Kart silindi!" });
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});

module.exports = router;

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
    const result = await pool.query(
      "SELECT username, full_name, phone, email FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcı Profili Güncelleme
app.put("/update-profile", authenticateToken, async (req, res) => {
  const { full_name, phone, email } = req.body;

  try {
    await pool.query(
      "UPDATE users SET full_name = $1, phone = $2, email = $3 WHERE id = $4",
      [full_name, phone, email, req.user.id]
    );

    res.json({ message: "Profile updated successfully" });
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


app.get("/balance", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/transfer', authenticateToken, async (req, res) => {
  const { recipientId, amount } = req.body;
  const senderId = req.user.id;

  if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid recipient or amount" });
  }

  try {
      const sender = await pool.query("SELECT balance FROM users WHERE id = $1", [senderId]);
      const recipient = await pool.query("SELECT balance FROM users WHERE id = $1", [recipientId]);

      if (sender.rows.length === 0 || recipient.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
      }

      if (sender.rows[0].balance < amount) {
          return res.status(400).json({ error: "Insufficient balance" });
      }

      await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, senderId]);
      await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, recipientId]);

      await pool.query(
          "INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
          [senderId, recipientId, amount]
      );

      res.json({ message: "Transaction successful" });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/request-money", authenticateToken, async (req, res) => {
  const { fromUserId, amount } = req.body;
  const toUserId = req.user.id;

  if (!fromUserId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Geçersiz para talebi" });
  }

  try {
    await pool.query(
      "INSERT INTO money_requests (from_user, to_user, amount, status) VALUES ($1, $2, $3, 'pending')",
      [fromUserId, toUserId, amount]
    );

    res.json({ message: "Para talebi gönderildi!" });
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});

router.post("/accept-request/:id", authenticateToken, async (req, res) => {
  const requestId = req.params.id;
  const toUserId = req.user.id;

  try {
    const request = await pool.query("SELECT * FROM money_requests WHERE id = $1 AND to_user = $2 AND status = 'pending'", [requestId, toUserId]);

    if (request.rows.length === 0) {
      return res.status(404).json({ error: "Para talebi bulunamadı!" });
    }

    const { from_user, amount } = request.rows[0];

    // Gönderenin bakiyesi yeterli mi?
    const sender = await pool.query("SELECT balance FROM users WHERE id = $1", [from_user]);
    if (sender.rows[0].balance < amount) {
      return res.status(400).json({ error: "Göndericinin yeterli bakiyesi yok!" });
    }

    // Para transferini gerçekleştir
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, from_user]);
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, toUserId]);

    // İşlemi kaydet ve isteği kapat
    await pool.query(
      "INSERT INTO transactions (sender_id, recipient_id, amount, status) VALUES ($1, $2, $3, 'completed')",
      [from_user, toUserId, amount]
    );
    await pool.query("UPDATE money_requests SET status = 'accepted' WHERE id = $1", [requestId]);

    res.json({ message: "Para talebi onaylandı ve transfer yapıldı!" });
  } catch (err) {
    res.status(500).json({ error: "Veritabanı hatası" });
  }
});


