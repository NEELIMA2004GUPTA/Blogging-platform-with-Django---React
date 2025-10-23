import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Container } from "react-bootstrap";
import { toast } from "react-toastify";
import API from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validateField(name, value);
  };

  // Validate each field
  const validateField = (name, value) => {
    let error = "";
    if (!value) {
      error = name === "identifier" ? "Username or Email is required" : "Password is required";
    } else if (name === "password" && value.length < 8) {
      error = "Password must be at least 8 characters";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const value = form[key];
      if (!value) {
        newErrors[key] = key === "identifier" ? "Username or Email is required" : "Password is required";
      } else if (key === "password" && value.length < 8) {
        newErrors[key] = "Password must be at least 8 characters";
      }
    });
    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) return;

    try {
      const res = await API.post(
        "/auth/login/",
        { identifier: form.identifier, password: form.password },
        { headers: { "Content-Type": "application/json" } }
      );

      const user = res.data.user;

      // Save tokens
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // Save user info
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username);
      localStorage.setItem("is_admin", user.is_admin);

      toast.success("Logged in successfully!");
      navigate("/home");
    } catch (err) {
      if (err.response) {
        // Backend responded with an error
        console.error("Backend response:", err.response.data);
        console.error("Status code:", err.response.status);

        if (err.response.status === 401) toast.error("Invalid credentials!");
        else if (err.response.status === 400) toast.error("Bad request! Please check your input.");
        else toast.error("Login failed!");
      } else if (err.request) {
        // Request made but no response
        console.error("No response received:", err.request);
        toast.error("No response from server. Check your network.");
      } else {
        // Other errors
        console.error("Error:", err.message);
        toast.error("Login failed!");
      }
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Login</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username or Email</Form.Label>
          <Form.Control
            type="text"
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            isInvalid={!!errors.identifier}
            placeholder="Enter your username or email"
          />
          <Form.Control.Feedback type="invalid">{errors.identifier}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            isInvalid={!!errors.password}
            placeholder="Enter your password"
          />
          <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
        </Form.Group>

        <div className="text-end mb-3">
          <Link to="/forgot-password" style={{ textDecoration: "none" }}>
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" className="w-100">
          Login
        </Button>
      </Form>
    </Container>
  );
}
