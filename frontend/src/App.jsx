import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddCard from "./pages/AddCard";
import Profile from "./pages/Profile";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import MoneyRequests from "./pages/MoneyRequests";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";
import FriendsPage from "./pages/FriendsPage";
import MerchantRequests from "./pages/MerchantRequests";
import PayMerchant from "./pages/PayMerchant";
import MerchantDashboard from "./pages/MerchantDashboard";
import SplitPayment from "./pages/SplitPayment";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTransactions from "./pages/AdminTransactions";
import AdminAddCard from "./pages/AdminAddCard";
import MerchantNavbar from "./MerchantNavbar";
import MerchantRequestHistory from "./pages/MerchantRequestsHistory";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    if (token) {
      axios
        .get("http://localhost:5001/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("ME DATA:", res.data);
          setIsAdmin(res.data.is_admin);
          setIsMerchant(res.data.is_merchant);
          setLoading(false);
        })
        .catch((err) => {
          console.error("ME ERROR:", err);
          setIsAdmin(false);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <Router>
        {token && (
          isAdmin ? <AdminNavbar /> :
          isMerchant ? <MerchantNavbar /> :
          <Navbar />
        )}      {!loading && (
        <Routes>
         <Route
            path="/"
            element={
              token ? (
                loading ? null : isAdmin ? (
                  <Navigate to="/admin-dashboard" />
                ) : isMerchant ? (
                  <Navigate to="/merchant-dashboard" />
                ) : (
                  <Navigate to="/dashboard" />
                )
              ) : (
                <Login setToken={setToken} />
              )
            }
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={token ? <Dashboard token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/admin-dashboard"
            element={token && isAdmin ? <AdminDashboard /> : <Navigate to="/" />}
          />
          <Route
            path="/merchant-dashboard"
            element={token ? <MerchantDashboard /> : <Navigate to="/" />}
          />
          <Route
            path="/add-card"
            element={token ? <AddCard token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={token ? <Profile token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/transfer"
            element={token ? <Transfer token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/transactions"
            element={token ? <Transactions /> : <Navigate to="/" />}
          />
          <Route
            path="/requests"
            element={token ? <MoneyRequests /> : <Navigate to="/" />}
          />
          <Route path="/friends" element={<FriendsPage />} />
          <Route
            path="/merchant-requests"
            element={token ? <MerchantRequests /> : <Navigate to="/" />}
          />
          <Route path="/pay-merchant" element={<PayMerchant />} />
          <Route
            path="/split-payment"
            element={token ? <SplitPayment /> : <Navigate to="/" />}
          />
          <Route
            path="/admin-transactions"
            element={token && isAdmin ? <AdminTransactions /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/add-card"
            element={token && isAdmin ? <AdminAddCard /> : <Navigate to="/" />}
          />
          <Route
            path="/merchant/requests"
            element={token ? <MerchantRequestHistory /> : <Navigate to="/" />}
          />
         
        </Routes>
      )}
    </Router>
  );
}

export default App;
