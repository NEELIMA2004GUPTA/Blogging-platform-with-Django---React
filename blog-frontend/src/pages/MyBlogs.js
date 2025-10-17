import React, { useEffect, useState, useCallback } from "react";
import { Container, Card, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function MyBlogs() {
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  // Fetch my blogs
  const fetchMyBlogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/blogs/?mine=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(res.data.blogs || res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your blogs!");
    }
  }, [token]);

  useEffect(() => {
    fetchMyBlogs();
  }, [fetchMyBlogs]);

  // Delete blog
  const handleDelete = async (id) => {
    if (!token) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/blogs/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Blog deleted!");
      fetchMyBlogs(); // refresh list
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete blog!");
    }
  };

  return (
    <Container className="mt-4">
      <h2>My Blogs</h2>
      {blogs.length === 0 && <p>You have not created any blogs yet.</p>}

      {blogs.map((blog) => (
        <Card key={blog.id} className="mb-3">
          <Card.Body>
            <Card.Title>{blog.title}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {blog.category?.name || "Uncategorized"}
            </Card.Subtitle>
            <Button variant="primary" onClick={() => navigate(`/blogs/${blog.id}`)}>
              View
            </Button>
            <Button
              variant="secondary"
              className="ms-2"
              onClick={() => navigate(`/edit-blog/${blog.id}`)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              className="ms-2"
              onClick={() => handleDelete(blog.id)}
            >
              Delete
            </Button>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
}
