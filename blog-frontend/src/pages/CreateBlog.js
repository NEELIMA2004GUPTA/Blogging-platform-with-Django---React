import React, { useState } from "react";
import { Form, Button, Container, InputGroup, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateBlog() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [publishAt, setPublishAt] = useState("");

  const token = localStorage.getItem("access");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must be logged in!");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category_name", category);
    if (image) formData.append("image", image);
    if (publishAt) formData.append("publish_at", publishAt);

    try {
      await axios.post(`http://127.0.0.1:8000/api/blogs/`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      toast.success("Blog created successfully!");
      navigate("/my-blogs");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to create blog!");
    }
  };

  const setNow = () => {
    const now = new Date();
    setPublishAt(now.toISOString().slice(0, 16));
  };

  return (
    <Container className="mt-4">
      <h2>Create a New Blog</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Control type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Enter category name" required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control as="textarea" rows={5} value={content} onChange={(e) => setContent(e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Publish Date & Time</Form.Label>
          <InputGroup>
            <Form.Control type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
            <Button variant="secondary" onClick={setNow}>Now</Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Image (optional)</Form.Label>
          <Form.Control type="file" onChange={handleImageChange} />
        </Form.Group>

        {previewImage && <Image src={previewImage} thumbnail style={{ width: "300px", height: "200px", objectFit: "cover" }} className="mb-3" />}

        <Button type="submit">Create Blog</Button>
      </Form>
    </Container>
  );
}
