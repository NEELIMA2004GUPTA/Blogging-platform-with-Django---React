import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function CreateCategory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!token) {
    navigate("/login");
    return null;
  }

  // Decode token to verify admin access
  const decoded = jwtDecode(token);
  const isAdmin = decoded?.is_admin || decoded?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="container mt-5 text-center">
        <h3 className="text-danger">Access Denied</h3>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/categories/",
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(`Category "${res.data.name}" created successfully.`);
      setName("");
      setDescription("");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("You must be an admin to create categories.");
      } else if (err.response?.data?.name) {
        setError("A category with this name already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Create New Category</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form
        onSubmit={handleSubmit}
        className="p-4 shadow rounded bg-light"
        style={{ maxWidth: "600px", margin: "0 auto" }}
      >
        <div className="form-group mb-3">
          <label>Category Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label>Description (optional)</label>
          <textarea
            className="form-control"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Create Category
        </button>
      </form>
    </div>
  );
}
