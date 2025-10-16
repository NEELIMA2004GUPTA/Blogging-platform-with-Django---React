import React, { useEffect, useState } from "react";
import { Container, Card, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function MyBlogs() {
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    fetchMyBlogs();
  }, []);

  const fetchMyBlogs = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/blogs/?mine=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(res.data.blogs || res.data);
    } catch (err) {
      toast.error("Failed to load your blogs!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/blogs/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Blog deleted!");
      fetchMyBlogs();
    } catch (err) {
      toast.error("Failed to delete blog!");
    }
  };

  return (
    <Container className="mt-4">
      <h2>My Blogs</h2>
      {blogs.map((blog) => (
        <Card key={blog.id} className="mb-3">
          <Card.Body>
            <Card.Title>{blog.title}</Card.Title>
            <Button variant="primary" onClick={() => navigate(`/blogs/${blog.id}`)}>View</Button>
            <Button variant="danger" className="ms-2" onClick={() => handleDelete(blog.id)}>Delete</Button>
            <Button variant="secondary" className="ms-2" onClick={() => navigate(`/create?id=${blog.id}`)}>Edit</Button>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
}
