import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/auth/login/", form);

      // Store access, refresh, and full user object
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // now includes is_admin

      toast.success("Logged in successfully!");
      navigate("/home"); // redirect after login
    } catch (err) {
      toast.error("Login failed!");
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
