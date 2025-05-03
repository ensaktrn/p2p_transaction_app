import { Navbar, Nav, Container } from "react-bootstrap";

function AdminNavbar() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/admin-dashboard">Admin Panel</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/admin-dashboard">Users</Nav.Link>
          <Nav.Link href="/admin/add-card">Add Valid Card</Nav.Link>
          <Nav.Link href="/admin-transactions">Transactions</Nav.Link>

        </Nav>
        <Nav>
          <Nav.Link onClick={logout}>Logout</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default AdminNavbar;
