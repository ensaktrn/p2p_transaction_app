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
  const { username, password, full_name, phone, email, is_merchant } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, phone, email, is_merchant)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, hashedPassword, full_name, phone, email, is_merchant || false]
    );

    res.json({ message: "User registered", user: result.rows[0] });

  } catch (err) {
    console.error("Register error:", err);
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

    const token = jwt.sign(
      { id: user.id, username: user.username, is_merchant: user.is_merchant },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });

  } catch (err) {
    console.error("Login error:", err);
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

app.post("/transfer", authenticateToken, async (req, res) => {
  const { recipientUsername, amount } = req.body;
  const senderId = req.user.id;

  if (!recipientUsername || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const normalizedAmount = parseFloat(amount).toFixed(2);

    // 1. Alıcıyı bul
    const recipientRes = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [recipientUsername]
    );

    if (recipientRes.rows.length === 0) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    const recipientId = recipientRes.rows[0].id;

    // 2. Gönderenin bakiyesini bul
    const senderBalanceRes = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [senderId]
    );

    const senderBalance = parseFloat(senderBalanceRes.rows[0].balance).toFixed(2);

    // 3. Bakiyeyi kontrol et
    if (parseFloat(senderBalance) < parseFloat(normalizedAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 4. Transfer işlemleri
    await pool.query("BEGIN");

    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [normalizedAmount, senderId]
    );

    await pool.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [normalizedAmount, recipientId]
    );

    await pool.query(
      "INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
      [senderId, recipientId, normalizedAmount]
    );

    await pool.query("COMMIT");

    res.json({ message: "Transfer successful" });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Transfer error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/request-money", authenticateToken, async (req, res) => {
  const { recipientUsername, amount } = req.body;

  try {
    const recipient = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [recipientUsername]
    );

    if (recipient.rows.length === 0) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    await pool.query(
      "INSERT INTO money_requests (sender_id, recipient_id, amount) VALUES ($1, $2, $3)",
      [req.user.id, recipient.rows[0].id, amount]
    );

    res.json({ message: "Money request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/money-requests", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM money_requests WHERE recipient_id = $1 AND status = 'pending'",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/respond-money-request", authenticateToken, async (req, res) => {
  const { requestId, action } = req.body;

  try {
    const requestQuery = await pool.query(
      "SELECT * FROM money_requests WHERE id = $1 AND recipient_id = $2",
      [requestId, req.user.id]
    );

    if (requestQuery.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = requestQuery.rows[0];

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already handled" });
    }

    // Balance kontrolü giriş yapan kullanıcıdan yapılmalı (yani request.recipient_id === req.user.id)
    const payer = await pool.query("SELECT balance FROM users WHERE id = $1", [req.user.id]);
    const normalizedAmount = parseFloat(request.amount).toFixed(2);
    const payerBalance = parseFloat(payer.rows[0].balance).toFixed(2);
    if (parseFloat(payerBalance) < parseFloat(normalizedAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Transfer işlemi
    await pool.query("BEGIN");
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [normalizedAmount, request.recipient_id]);
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [normalizedAmount, request.sender_id]);
    await pool.query(
      "INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
      [request.recipient_id, request.sender_id, normalizedAmount]
    );
    await pool.query("UPDATE money_requests SET status = 'accepted' WHERE id = $1", [request.id]);
    await pool.query("COMMIT");

    res.json({ message: "Request accepted and transaction completed" });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id,
        u1.username AS sender_username,
        u2.username AS recipient_username,
        t.amount,
        t.created_at
      FROM transactions t
      JOIN users u1 ON u1.id = t.sender_id
      JOIN users u2 ON u2.id = t.recipient_id
      WHERE t.sender_id = $1 OR t.recipient_id = $1
      ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});
// for admin
app.post("/add-friend", authenticateToken, async (req, res) => {
  const { friendUsername } = req.body;

  try {
    const friend = await pool.query("SELECT id FROM users WHERE username = $1", [friendUsername]);
    if (friend.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendId = friend.rows[0].id;

    // İki yönlü arkadaşlık ekle
    await pool.query("BEGIN");

    await pool.query(
      "INSERT INTO friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, friendId]
    );

    await pool.query(
      "INSERT INTO friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [friendId, req.user.id]
    );

    await pool.query("COMMIT");

    res.json({ message: "Friend added successfully" });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/remove-friend", authenticateToken, async (req, res) => {
  const { friendUsername } = req.body;

  try {
    const friend = await pool.query("SELECT id FROM users WHERE username = $1", [friendUsername]);
    if (friend.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendId = friend.rows[0].id;

    // İki yönlü arkadaşlığı sil
    await pool.query("BEGIN");

    await pool.query(
      "DELETE FROM friends WHERE user_id = $1 AND friend_id = $2",
      [req.user.id, friendId]
    );

    await pool.query(
      "DELETE FROM friends WHERE user_id = $1 AND friend_id = $2",
      [friendId, req.user.id]
    );

    await pool.query("COMMIT");

    res.json({ message: "Friend removed successfully" });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/send-friend-request", authenticateToken, async (req, res) => {
  const { recipientUsername } = req.body;

  try {
    const recipient = await pool.query("SELECT id FROM users WHERE username = $1", [recipientUsername]);
    if (recipient.rows.length === 0) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    await pool.query(
      "INSERT INTO friend_requests (sender_id, recipient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, recipient.rows[0].id]
    );

    res.json({ message: "Friend request sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/friend-requests", authenticateToken, async (req, res) => {
  try {
    const requests = await pool.query(
      `SELECT fr.id, u.username AS sender_username
       FROM friend_requests fr
       JOIN users u ON u.id = fr.sender_id
       WHERE fr.recipient_id = $1 AND fr.status = 'pending'`,
      [req.user.id]
    );

    res.json(requests.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/respond-friend-request", authenticateToken, async (req, res) => {
  const { requestId, action } = req.body; // action = 'accept' veya 'reject'

  try {
    const request = await pool.query("SELECT * FROM friend_requests WHERE id = $1 AND recipient_id = $2", [
      requestId,
      req.user.id
    ]);

    if (request.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (action === "accept") {
      await pool.query("BEGIN");

      const senderId = request.rows[0].sender_id;
      const recipientId = request.rows[0].recipient_id;

      // Arkadaş olarak iki tarafa da ekle
      await pool.query(
        "INSERT INTO friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [senderId, recipientId]
      );
      await pool.query(
        "INSERT INTO friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [recipientId, senderId]
      );

      // İsteği 'accepted' yap
      await pool.query("UPDATE friend_requests SET status = 'accepted' WHERE id = $1", [requestId]);

      await pool.query("COMMIT");

      res.json({ message: "Friend request accepted" });
    } else {
      // İsteği 'rejected' yap
      await pool.query("UPDATE friend_requests SET status = 'rejected' WHERE id = $1", [requestId]);
      res.json({ message: "Friend request rejected" });
    }

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/friends-list", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.username 
       FROM friends f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/merchants", authenticateToken, async (req, res) => {
  try {
    const merchants = await pool.query(
      "SELECT username FROM users WHERE is_merchant = true"
    );
    res.json(merchants.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/pay-merchant", authenticateToken, async (req, res) => {
  const { merchantUsername, amount } = req.body;

  if (!merchantUsername || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment request" });
  }

  const senderId = req.user.id;

  try {
    const normalizedAmount = parseFloat(amount).toFixed(2);

    // Merchant'ı bul
    const merchantRes = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND is_merchant = true",
      [merchantUsername]
    );

    if (merchantRes.rows.length === 0) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    const merchantId = merchantRes.rows[0].id;

    // Sender balance kontrolü
    const senderBalanceRes = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [senderId]
    );

    const senderBalance = parseFloat(senderBalanceRes.rows[0].balance).toFixed(2);

    if (parseFloat(senderBalance) < parseFloat(normalizedAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Para transferi
    await pool.query("BEGIN");

    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [normalizedAmount, senderId]
    );
    await pool.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [normalizedAmount, merchantId]
    );

    await pool.query(
      "INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
      [senderId, merchantId, normalizedAmount]
    );

    await pool.query("COMMIT");

    res.json({ message: "Payment successful" });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/merchant-transactions", authenticateToken, async (req, res) => {
  try {
    const transactions = await pool.query(
      `SELECT t.amount, u.username as sender_username, t.created_at
       FROM transactions t
       JOIN users u ON u.id = t.sender_id
       WHERE t.recipient_id = $1`,
      [req.user.id]
    );

    res.json(transactions.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/split-request", authenticateToken, async (req, res) => {
  const { recipients, totalAmount } = req.body;
  const senderId = req.user.id;

  if (!recipients || recipients.length === 0 || !totalAmount || totalAmount <= 0) {
    return res.status(400).json({ error: "Invalid split request" });
  }

  const splitAmount = (parseFloat(totalAmount) / recipients.length).toFixed(2);

  try {
    for (const username of recipients) {
      // Her alıcıyı bul
      const userRes = await pool.query("SELECT id FROM users WHERE username = $1", [username]);

      if (userRes.rows.length === 0) continue; // kullanıcı bulunamazsa geç
      
      const recipientId = userRes.rows[0].id;

      // Money request oluştur
      await pool.query(
        "INSERT INTO money_requests (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
        [senderId, recipientId, splitAmount]
      );
    }

    res.json({ message: "Split money requests sent successfully!" });

  } catch (error) {
    console.error("Split Request Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
