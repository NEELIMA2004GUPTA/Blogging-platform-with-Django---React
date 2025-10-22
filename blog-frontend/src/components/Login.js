import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container } from "react-bootstrap";
import { toast } from "react-toastify";
import API from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login/", form);

      // Store access, refresh, and full user object
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // now includes is_admin

      toast.success("Logged in successfully!");
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message); // Debug: shows backend error
      if (err.response) {
        if (err.response.status === 401) {
          toast.error("Invalid credentials!");
        } else if (err.response.status === 404) {
          toast.error("Login endpoint not found!");
        } else {
          toast.error("Login failed! Check console for details.");
        }
      } else {
        toast.error("Network or server error!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Login</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" name="username" value={form.username} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" name="password" value={form.password} onChange={handleChange} required />
        </Form.Group>
        <Button type="submit" className="w-100">Login</Button>
      </Form>
    </Container>
  );
}
