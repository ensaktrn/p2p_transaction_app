import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Profile({ token }) {
  const [profile, setProfile] = useState({ username: "", full_name: "", phone: "", email: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5001/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (error) {
      alert("Failed to fetch profile");
    }
  };

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put("http://localhost:5001/update-profile", profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="p-4 w-50">
        <h2 className="text-center">Update Profile</h2>
        <Form onSubmit={handleUpdate}>
          <Form.Group>
            <Form.Control type="text" name="full_name" placeholder="Full Name" value={profile.full_name} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Control type="text" name="phone" placeholder="Phone" value={profile.phone} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Control type="email" name="email" placeholder="Email" value={profile.email} onChange={handleChange} required />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mt-2">
            Update Profile
          </Button>
        </Form>
        <p className="text-center mt-2">
          <a href="/dashboard">Back to Dashboard</a>
        </p>
      </Card>
    </Container>
  );
}

export default Profile;
