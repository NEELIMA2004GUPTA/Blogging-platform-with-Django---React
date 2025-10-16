import React, { useState, useEffect } from "react";
import { Form, Button, Container, InputGroup } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateEditBlog() {
  const { id } = useParams(); // get blog id if editing
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [publishAt, setPublishAt] = useState("");

  const token = localStorage.getItem("access");

  // Prefill form if editing
  useEffect(() => {
    if (id && token) {
      axios
        .get(`http://127.0.0.1:8000/api/blogs/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setTitle(res.data.title);
          setContent(res.data.content);
          setCategory(res.data.category?.name || "");
          setPublishAt(res.data.publish_at || "");
        })
        .catch((err) => {
          console.log(err.response?.data);
          toast.error("Failed to load blog for editing!");
        });
    }
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("You must be logged in!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category_name", category);
    if (image) formData.append("image", image);
    if (publishAt) formData.append("publish_at", publishAt);

    try {
      if (id) {
        // Editing existing blog
        await axios.put(`http://127.0.0.1:8000/api/blogs/${id}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Blog updated successfully!");
      } else {
        // Creating new blog
        await axios.post(`http://127.0.0.1:8000/api/blogs/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Blog created successfully!");
      }

      navigate("/my-blogs");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to save blog!");
    }
  };

  const setNow = () => {
    const now = new Date();
    const isoString = now.toISOString().slice(0, 16);
    setPublishAt(isoString);
  };

  return (
    <Container className="mt-4">
      <h2>{id ? "Edit Blog" : "Create a New Blog"}</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Control
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter category name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Publish Date & Time</Form.Label>
          <InputGroup>
            <Form.Control
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
            <Button variant="secondary" onClick={setNow}>
              Now
            </Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Image (optional)</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </Form.Group>

        <Button type="submit">{id ? "Update Blog" : "Create Blog"}</Button>
      </Form>
    </Container>
  );
}
