import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Card, Table, Form, Button } from "react-bootstrap";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState({}); // id -> edited fields
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5001/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const handleEdit = (id, field, value) => {
    setEditedUsers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleUpdate = async (userId) => {
    setMessage("");

    const updated = editedUsers[userId];
    if (!updated) return;

    try {
      await axios.post(
        "http://localhost:5001/admin/update-user",
        {
          userId,
          ...updated,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setMessage("User updated.");
      setEditedUsers({});
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed.");
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3 className="mb-4 text-center">Admin Dashboard - User Management</h3>
        {message && <p className="text-center">{message}</p>}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Form.Control
                    type="text"
                    defaultValue={u.username}
                    onChange={(e) => handleEdit(u.id, "username", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    defaultValue={u.full_name}
                    onChange={(e) => handleEdit(u.id, "full_name", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="email"
                    defaultValue={u.email}
                    onChange={(e) => handleEdit(u.id, "email", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    defaultValue={u.phone}
                    onChange={(e) => handleEdit(u.id, "phone", e.target.value)}
                  />
                </td>
                <td>
                    <Form.Control
                        type="number"
                        defaultValue={u.balance}
                        onChange={(e) => handleEdit(u.id, "balance", e.target.value)}
                    />
                    </td>               
                <td>
                  <Button variant="success" size="sm" onClick={() => handleUpdate(u.id)}>
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
}

export default AdminDashboard;
