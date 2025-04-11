import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddCard from "./pages/AddCard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Transfer from "./pages/Transfer";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={token ? <Dashboard token={token} /> : <Navigate to="/" />} />
        <Route path="/add-card" element={token ? <AddCard token={token} /> : <Navigate to="/" />} />
        <Route path="/profile" element={token ? <Profile token={token} /> : <Navigate to="/" />} />
        <Route path="/transfer" element={token ? <Transfer token={token} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
