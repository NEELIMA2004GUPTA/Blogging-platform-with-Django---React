import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function CategoryManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user and check admin
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const res = await API.get("/auth/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setIsAdmin(res.data.is_admin || res.data.role === "admin");
      } catch (err) {
        console.error(err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Fetch categories after confirming admin
  useEffect(() => {
    if (!token || !isAdmin) return;

    const fetchCategories = async () => {
      try {
        const res = await API.get("/categories/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, [token, isAdmin]);

  if (loading) return null;

  // Redirect if not logged in
  if (!token) {
    navigate("/login");
    return null;
  }

  // Access denied if not admin
  if (!isAdmin) {
    return (
      <div className="container mt-5 text-center">
        <h3 className="text-danger">Access Denied</h3>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  // Handle form submit (create / update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      let res;
      if (editingId) {
        res = await API.put(
          `/categories/${editingId}/`,
          { name, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingId ? res.data : cat))
        );
        setMessage(`Category "${res.data.name}" updated successfully.`);
      } else {
        res = await API.post(
          "/categories/",
          { name, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCategories((prev) => [...prev, res.data]);
        setMessage(`Category "${res.data.name}" created successfully.`);
      }

      setName("");
      setDescription("");
      setEditingId(null);
      navigate("/home");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("You must be an admin to create/edit categories.");
      } else if (err.response?.data?.name) {
        setError("A category with this name already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // Handle edit
  const handleEdit = (category) => {
    setName(category.name);
    setDescription(category.description);
    setEditingId(category.id);
    setMessage(null);
    setError(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await API.delete(`/categories/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      setMessage("Category deleted successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to delete category.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Category Management</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Form */}
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
          {editingId ? "Update Category" : "Create Category"}
        </button>
      </form>

      {/* Category List */}
      <div className="mt-5">
        <h4>Existing Categories</h4>
        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>{cat.description}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(cat)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(cat.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
