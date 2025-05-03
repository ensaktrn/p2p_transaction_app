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

app.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, full_name, is_admin, is_merchant FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/users", authenticateToken, async (req, res) => {
  const result = await pool.query("SELECT id, username FROM users WHERE is_merchant = false");
  res.json(result.rows);
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

app.post("/money-request", authenticateToken, async (req, res) => {
  const { username, amount } = req.body;

  const parsedAmount = parseFloat(amount);
  if (!username || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const userRes = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    const recipientId = userRes.rows[0].id;

    await pool.query(
      "INSERT INTO money_requests (sender_id, recipient_id, amount, status, created_at) VALUES ($1, $2, $3, 'pending', NOW())",
      [req.user.id, recipientId, parsedAmount]
    );

    res.json({ message: "Money request sent successfully." });
  } catch (err) {
    console.error("Money request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/money-requests", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mr.id, mr.amount, u.username AS sender_username, mr.created_at
       FROM money_requests mr
       JOIN users u ON u.id = mr.sender_id
       WHERE mr.recipient_id = $1 AND mr.status = 'pending'`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



app.post("/money-request/respond", authenticateToken, async (req, res) => {
  const { requestId, action } = req.body;

  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    const reqRes = await pool.query(
      "SELECT * FROM money_requests WHERE id = $1 AND recipient_id = $2",
      [requestId, req.user.id]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = reqRes.rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ error: "Already responded." });
    }

    if (action === 'reject') {
      await pool.query("UPDATE money_requests SET status = 'rejected' WHERE id = $1", [requestId]);
      return res.json({ message: "Request rejected." });
    }

    // accept işlemi
    const balanceRes = await pool.query("SELECT balance FROM users WHERE id = $1", [req.user.id]);
    const balance = parseFloat(balanceRes.rows[0].balance);
    const amount = parseFloat(request.amount);

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    await pool.query("BEGIN");
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, req.user.id]);
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, request.sender_id]);
    await pool.query("INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
      [req.user.id, request.sender_id, amount]);
    await pool.query("UPDATE money_requests SET status = 'accepted' WHERE id = $1", [requestId]);
    await pool.query("COMMIT");

    res.json({ message: "Request accepted and transferred." });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Respond error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/pending-requests-count", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM money_requests WHERE recipient_id = $1 AND status = 'pending'",
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error("Pending count error", err);
    res.status(500).json({ error: "Server error" });
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
  const result = await pool.query("SELECT id, username, full_name FROM users WHERE is_merchant = true");
  res.json(result.rows);
});

app.post("/subscribe-merchant", authenticateToken, async (req, res) => {
  const { merchantId } = req.body;

  if (!merchantId) {
    return res.status(400).json({ error: "Missing merchant ID" });
  }

  try {
    // Merchant gerçekten merchant mı?
    const checkMerchant = await pool.query("SELECT * FROM users WHERE id = $1 AND is_merchant = true", [merchantId]);
    if (checkMerchant.rows.length === 0) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    // Aynı kullanıcı daha önce abone olmuş mu?
    const check = await pool.query(
      "SELECT * FROM merchant_subscriptions WHERE user_id = $1 AND merchant_id = $2",
      [req.user.id, merchantId]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: "Already subscribed." });
    }

    // Aboneliği kaydet
    await pool.query(
      "INSERT INTO merchant_subscriptions (user_id, merchant_id) VALUES ($1, $2)",
      [req.user.id, merchantId]
    );

    res.json({ message: "Subscribed successfully." });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/merchant/subscribers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.full_name
      FROM merchant_subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.merchant_id = $1
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch subscribers error:", err);
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

app.post("/merchant/request-payment", authenticateToken, async (req, res) => {
  const { username, amount } = req.body;

  try {
    const me = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (me.rows[0]?.is_admin) return res.status(403).json({ error: "Admins cannot request payments." });

    const user = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

    await pool.query(
      "INSERT INTO merchant_requests (merchant_id, user_id, amount) VALUES ($1, $2, $3)",
      [req.user.id, user.rows[0].id, amount]
    );

    res.json({ message: "Payment request sent" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/merchant/requests", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.amount, r.status, r.created_at, u.username AS merchant
      FROM merchant_requests r
      JOIN users u ON r.merchant_id = u.id
      WHERE r.user_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/merchant/handle-request", authenticateToken, async (req, res) => {
  const { requestId, action } = req.body; // action = 'accept' | 'reject'

  try {
    const r = await pool.query("SELECT * FROM merchant_requests WHERE id = $1", [requestId]);
    const request = r.rows[0];

    if (!request || request.user_id !== req.user.id || request.status !== 'pending') {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (action === "reject") {
      await pool.query("UPDATE merchant_requests SET status = 'rejected' WHERE id = $1", [requestId]);
      return res.json({ message: "Payment rejected" });
    }

    // Check user balance
    const balanceCheck = await pool.query("SELECT balance FROM users WHERE id = $1", [req.user.id]);
    if (parseFloat(balanceCheck.rows[0].balance) < parseFloat(request.amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Proceed with payment
    await pool.query("BEGIN");
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [request.amount, req.user.id]);
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [request.amount, request.merchant_id]);
    await pool.query("INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
      [req.user.id, request.merchant_id, request.amount]);
    await pool.query("UPDATE merchant_requests SET status = 'accepted' WHERE id = $1", [requestId]);
    await pool.query("COMMIT");

    res.json({ message: "Payment completed" });

  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/merchant/request-history", authenticateToken, async (req, res) => {
  const result = await pool.query(`
    SELECT r.id, r.amount, r.status, r.created_at, u.username
    FROM merchant_requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.merchant_id = $1
    ORDER BY r.created_at DESC
  `, [req.user.id]);

  res.json(result.rows);
});
app.get("/merchant/transactions", authenticateToken, async (req, res) => {
  const result = await pool.query(`
    SELECT t.id, t.amount, t.created_at, u.username AS sender
    FROM transactions t
    JOIN users u ON t.sender_id = u.id
    WHERE t.recipient_id = $1
    ORDER BY t.created_at DESC
  `, [req.user.id]);

  res.json(result.rows);
});


app.post("/split-payment", authenticateToken, async (req, res) => {
  const { amount, participantUsernames } = req.body;

  if (!amount || !participantUsernames || participantUsernames.length === 0) {
    return res.status(400).json({ error: "Amount and participants required" });
  }

  // Katılımcıları DB'den al
  try {
    const usersResult = await pool.query(
      "SELECT id, username, balance FROM users WHERE username = ANY($1::text[])",
      [participantUsernames]
    );

    const participants = usersResult.rows;

    if (participants.length !== participantUsernames.length) {
      return res.status(404).json({ error: "Some users not found" });
    }

    const perPersonAmount = parseFloat(amount) / participantUsernames.length;

    // Yeterli bakiye kontrolü
    for (const p of participants) {
      if (parseFloat(p.balance) < perPersonAmount) {
        return res.status(400).json({ error: `User ${p.username} has insufficient balance` });
      }
    }

    await pool.query("BEGIN");

    // Herkesten bakiye düş + transaction kaydet
    for (const p of participants) {
      await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [perPersonAmount, p.id]);
      await pool.query(
        "INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, NULL, $2, NOW())",
        [p.id, perPersonAmount]
      );
    }

    await pool.query("COMMIT");
    res.json({ message: "Split payment completed successfully" });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Split error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/money-requests/:id/accept", authenticateToken, async (req, res) => {
  const requestId = req.params.id;

  try {
    const reqRes = await pool.query("SELECT * FROM money_requests WHERE id = $1", [requestId]);
    if (reqRes.rows.length === 0) return res.status(404).json({ error: "Request not found" });

    const request = reqRes.rows[0];

    // Request'i sadece ilgili kullanıcı kabul edebilir
    if (request.recipient_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Kullanıcının bakiyesi yeterli mi?
    const balanceRes = await pool.query("SELECT balance FROM users WHERE id = $1", [request.recipient_id]);
    const balance = parseFloat(balanceRes.rows[0].balance);
    const amount = parseFloat(request.amount);

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    await pool.query("BEGIN");

    // Bakiye güncelle
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, request.recipient_id]);
    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, request.sender_id]);

    // Transaction kaydet
    await pool.query(
      "INSERT INTO transactions (sender_id, recipient_id, amount, created_at) VALUES ($1, $2, $3, NOW())",
      [request.recipient_id, request.sender_id, amount]
    );

    // İsteği sil
    await pool.query("DELETE FROM money_requests WHERE id = $1", [requestId]);

    await pool.query("COMMIT");

    res.json({ message: "Request accepted and payment sent." });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Accept error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/money-requests/:id/reject", authenticateToken, async (req, res) => {
  const requestId = req.params.id;

  try {
    const reqRes = await pool.query("SELECT * FROM money_requests WHERE id = $1", [requestId]);
    if (reqRes.rows.length === 0) return res.status(404).json({ error: "Request not found" });

    const request = reqRes.rows[0];

    if (request.recipient_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.query("DELETE FROM money_requests WHERE id = $1", [requestId]);
    res.json({ message: "Request rejected." });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// For admin

app.get("/admin/users", authenticateToken, async (req, res) => {
  try {
    const adminCheck = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await pool.query("SELECT id, username, full_name, email, phone, balance FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Admin user list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/admin/cards", authenticateToken, async (req, res) => {
  try {
    const adminCheck = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await pool.query(`
      SELECT cards.card_number, cards.balance, cards.card_holder, cards.expiry, users.username
      FROM cards
      JOIN users ON cards.user_id = users.id
      ORDER BY cards.card_number
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Admin get cards error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/update-balance", authenticateToken, async (req, res) => {
  const { userId, newBalance } = req.body;

  try {
    const adminCheck = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await pool.query("UPDATE users SET balance = $1 WHERE id = $2", [newBalance, userId]);
    res.json({ message: "Balance updated." });
  } catch (err) {
    console.error("Balance update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/admin/transactions", authenticateToken, async (req, res) => {
  try {
    const admin = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (!admin.rows[0]?.is_admin) return res.status(403).json({ error: "Unauthorized" });

    const result = await pool.query(`
      SELECT t.id, t.amount, t.created_at, u1.username AS sender, u2.username AS recipient
      FROM transactions t
      JOIN users u1 ON t.sender_id = u1.id
      JOIN users u2 ON t.recipient_id = u2.id
      WHERE t.is_deleted = false
      ORDER BY t.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/delete-transaction", authenticateToken, async (req, res) => {
  const { transactionId } = req.body;

  try {
    const adminCheck = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) return res.status(403).json({ error: "Unauthorized" });

    const txRes = await pool.query("SELECT * FROM transactions WHERE id = $1", [transactionId]);
    const tx = txRes.rows[0];
    if (!tx || tx.is_deleted) return res.status(404).json({ error: "Transaction not found" });

    const amount = parseFloat(tx.amount);

    await pool.query("BEGIN");

    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, tx.sender_id]);
    await pool.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, tx.recipient_id]);

    await pool.query("UPDATE transactions SET is_deleted = true WHERE id = $1", [transactionId]);

    await pool.query("COMMIT");

    res.json({ message: "Transaction cancelled successfully." });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Delete transaction error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/update-user", authenticateToken, async (req, res) => {
  const {
    userId,
    full_name = "",
    phone = "",
    email = "",
    username = "",
    makeAdmin = false,
    balance = 0
  } = req.body;

  try {
    const requester = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
    if (!requester.rows[0]?.is_admin) {
      return res.status(403).json({ error: "Only admins can update users." });
    }

    // Kullanıcı kontrolü
    const userResult = await pool.query("SELECT is_merchant FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMerchant = userResult.rows[0].is_merchant;
    const adminValue = isMerchant ? false : !!makeAdmin;

    await pool.query(
      `UPDATE users
       SET full_name = $1,
           phone = $2,
           email = $3,
           username = $4,
           is_admin = $5,
           balance = $6
       WHERE id = $7`,
      [
        full_name,
        phone,
        email,
        username,
        adminValue,
        parseFloat(balance),
        userId
      ]
    );

    res.json({ message: "User updated successfully." });
  } catch (err) {
    console.error("❌ Update user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



app.get("/admin/users", authenticateToken, async (req, res) => {
  const adminCheck = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.user.id]);
  if (!adminCheck.rows[0]?.is_admin) return res.status(403).json({ error: "Access denied" });

  const result = await pool.query("SELECT id, username, full_name, email, phone, is_admin, is_merchant, balance FROM users ORDER BY id");
  res.json(result.rows);
});
