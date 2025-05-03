import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">WalletApp</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
            <li className="nav-item">
            <Link className="nav-link" to="/dashboard">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/profile">Profile</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/friends">Friends</Link>
            </li>
          <li className="nav-item">
            <Link className="nav-link" to="/add-card">Add Card</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/transfer">Transfer</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/requests">Money Requests</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/split-payment">Split Payment</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/merchant-requests">Merchant Requests</Link>
          </li>
          
          <li className="nav-item">
            <Link className="nav-link" to="/transactions">History</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
