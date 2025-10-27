import React, { useState, useEffect } from "react";
import { Form, Button, Container, InputGroup, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function CreateBlog() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [content, setContent] = useState(""); 
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [publishAt, setPublishAt] = useState("");
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("access");

  useEffect(() => {
    // Fetch existing categories
    const fetchCategories = async () => {
      try {
        const res = await API.get("/categories/");
        setCategories(res.data.categories || res.data);
      } catch (err) {
        console.log(err.response?.data);
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Invalid file type!" }));
      setImage(null);
      setPreviewImage(null);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "File size exceeds 5MB!" }));
      setImage(null);
      setPreviewImage(null);
      return;
    }

    setErrors((prev) => ({ ...prev, image: "" }));
    setImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("You must be logged in!");

    const newErrors = {};

    // Regex validation for title only
    const titleRegex = /^[\w\s.,!?'-]{3,100}$/;
    if (!titleRegex.test(title)) {
      newErrors.title = "Title must be 3-100 chars and contain valid characters.";
    }

    if (!category) newErrors.category = "Category is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category_name", category);
    formData.append("content", content); // include content
    if (image) formData.append("image", image);
    if (publishAt) formData.append("publish_at", publishAt);

    try {
      await API.post(`/blogs/`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      alert("Blog created successfully!");
      navigate("/my-blogs");
    } catch (err) {
      console.log(err.response?.data);
      alert("Failed to create blog!");
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
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isInvalid={!!errors.title}
            placeholder="Enter blog title"
          />
          <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            isInvalid={!!errors.category}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your blog content here..."
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
            <Button variant="secondary" onClick={setNow}>Now</Button>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Image (optional)</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            isInvalid={!!errors.image}
          />
          <Form.Text className="text-muted">
            Allowed formats: jpg, png, gif, webp | Max size: 5MB
          </Form.Text>
          <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
        </Form.Group>

        {previewImage && (
          <Image
            src={previewImage}
            thumbnail
            style={{ width: "300px", height: "200px", objectFit: "cover" }}
            className="mb-3"
          />
        )}

        <Button type="submit">Create Blog</Button>
      </Form>
    </Container>
  );
}
