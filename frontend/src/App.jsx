import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddCard from "./pages/AddCard";
import Profile from "./pages/Profile";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import MoneyRequests from "./pages/MoneyRequests";
import Navbar from "./Navbar";
import FriendsPage from "./pages/FriendsPage";
import MerchantList from "./pages/MerchantList";
import PayMerchant from "./pages/PayMerchant";
import MerchantDashboard from "./pages/MerchantDashboard";
import SplitPayment from "./pages/SplitPayment";


function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <Router>
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={token ? <Dashboard token={token} /> : <Navigate to="/" />} />
        <Route path="/merchant-dashboard" element={token ? <MerchantDashboard /> : <Navigate to="/" />} />
        <Route path="/add-card" element={token ? <AddCard token={token} /> : <Navigate to="/" />} />
        <Route path="/profile" element={token ? <Profile token={token} /> : <Navigate to="/" />} />
        <Route path="/transfer" element={token ? <Transfer token={token} /> : <Navigate to="/" />} />
        <Route path="/transactions" element={token ? <Transactions /> : <Navigate to="/" />} />
        <Route path="/requests" element={token ? <MoneyRequests /> : <Navigate to="/" />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/merchants" element={<MerchantList />} />
        <Route path="/pay-merchant" element={<PayMerchant />} />
        <Route path="/split-payment" element={token ? <SplitPayment /> : <Navigate to="/" />} />
        </Routes>
    </Router>
  );
}

export default App;
