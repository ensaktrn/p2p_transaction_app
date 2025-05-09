
-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT false,
    is_merchant BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false
);

-- VALID CARDS TABLE
CREATE TABLE valid_cards (
    id SERIAL PRIMARY KEY,
    card_number VARCHAR(16) UNIQUE NOT NULL,
    holder_name VARCHAR(100),
    expiry_date DATE,
    cvv VARCHAR(4),
    balance NUMERIC(10,2) DEFAULT 0
);

-- CARDS TABLE
CREATE TABLE cards (
    card_number VARCHAR(16) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    holder_name VARCHAR(100),
    expiry_date DATE,
    cvv VARCHAR(4),
    balance NUMERIC(10,2) DEFAULT 0
);

-- FRIENDS TABLE
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id)
);

-- FRIEND REQUESTS TABLE
CREATE TABLE friend_requests (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending'
);

-- MONEY REQUESTS TABLE
CREATE TABLE money_requests (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    amount NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'pending'
);

-- TRANSACTIONS TABLE
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    amount NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MERCHANT SUBSCRIPTIONS TABLE
CREATE TABLE merchant_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    merchant_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MERCHANT REQUESTS TABLE
CREATE TABLE merchant_requests (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER REFERENCES users(id),
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(10,2),
    status VARCHAR(20) DEFAULT 'pending'
);

INSERT INTO valid_cards (card_number, holder_name, expiry_date, cvv) VALUES
('4000123412341234', 'Emily White', '2026-08-31', 321),
('4012888888881881', 'Michael Green', '2027-01-15', 654),
('4222222222222', 'Sarah Johnson', '2031-07-01', 987),
('5105105105105100', 'Chris Evans', '2034-09-25', 432),
('6011000990139424', 'Emma Watson', '2026-06-30', 876),
('3530111333300000', 'David Miller', '2028-04-20', 123),
('6304000000000000', 'Liam Wilson', '2029-12-12', 345),
('4000056655665556', 'Olivia Taylor', '2026-10-10', 678),
('6011111111111117', 'Benjamin Moore', '2027-03-03', 890),
('30569309025904', 'Sophia Anderson', '2027-11-11', 901),
('6011601160116611', 'Jacob Thomas', '2028-05-05', 234),
('5019717010103742', 'Charlotte Martin', '2026-02-02', 567),
('4571736000000000', 'James Jackson', '2027-07-07', 890),
('374245455400126', 'Amelia Harris', '2028-09-09', 345),
('6759649826438453', 'Daniel Lewis', '2026-06-06', 678),
('4111111111111112', 'Ethan Walker', '2029-10-10', 789),
('5555555555554445', 'Grace Young', '2027-12-12', 432),
('378734493671000', 'Mason Scott', '2028-08-08', 123),
('6011000400000000', 'Lily King', '2026-11-11', 456),
('3530111111111111', 'Logan Wright', '2025-09-09', 987),
('3566002020360505', 'Avery Turner', '2027-07-07', 321),
('490154203237518', 'Harper Hill', '2026-06-06', 654),
('6331101999990016', 'Elijah Adams', '2027-05-05', 876),
('6759649826438452', 'Ella Nelson', '2029-04-04', 234),
('6767709999999999', 'Lucas Carter', '2028-03-03', 567),
('5000000000000611', 'Chloe Mitchell', '2026-02-02', 890),
('5895620000000001', 'Henry Perez', '2027-01-01', 901),
('5105105105105101', 'Aria Roberts', '2028-12-31', 345),
('6011201234567890', 'Sebastian Turner', '2026-10-30', 678),
('4024007198781234', 'Nora Edwards', '2027-09-29', 789),
('4000002500003155', 'Jack Morris', '2027-08-28', 432),
('6011000000000004', 'Zoe Campbell', '2028-07-27', 123),
('378734493671001', 'Leo Rogers', '2026-06-26', 456),
('343434343434343', 'Hazel Reed', '2027-05-25', 987),
('6011111111111127', 'Isaac Cook', '2029-04-24', 321),
('3528000700000000', 'Sofia Morgan', '2029-03-23', 654),
('6304000000000011', 'Owen Bell', '2026-02-22', 876),
('4000000000000002', 'Layla Murphy', '2027-01-21', 234),
('4266844348739003', 'Carter Bailey', '2028-12-20', 567),
('4111111111111113', 'Aubrey Rivera', '2026-11-19', 890),
('4917610000000000', 'Julian Cooper', '2027-10-18', 901),
('6011888888888888', 'Violet Richardson', '2025-09-17', 345),
('5146310000000007', 'Wyatt Cox', '2026-08-16', 678),
('4917300800000000', 'Aurora Howard', '2029-07-15', 789),
('6011100000000001', 'Lincoln Ward', '2027-06-14', 432),
('4571736000000001', 'Savannah Brooks', '2028-05-13', 123),
('343434343434344', 'Nathan Gray', '2026-04-12', 456),
('6011209876543210', 'Penelope Barnes', '2027-03-11', 987),
('3566002020360506', 'Anthony Powell', '2028-02-10', 321),
('6767709999999998', 'Stella Watson', '2026-01-09', 654);
