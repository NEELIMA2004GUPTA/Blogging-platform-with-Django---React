import React, { useState, useEffect } from "react";
import { Form, Button, Container, InputGroup, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

export default function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(""); 
  const [publishAt, setPublishAt] = useState("");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get("/categories/");
        const cats = Array.isArray(res.data) ? res.data : res.data?.categories || [];
        setCategories(cats);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load categories!");
      }
    };
    fetchCategories();
  }, []);

  // Prefill blog
  useEffect(() => {
    if (id && token) {
      API.get(`/blogs/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setTitle(res.data.title);
          setContent(res.data.content);
          setCategory(res.data.category?.name || "");
          setPublishAt(res.data.publish_at || "");
          if (res.data.image) setPreview(res.data.image);
        })
        .catch((err) => {
          console.log(err.response?.data);
          toast.error("Failed to load blog for editing!");
        });
    }
  }, [id, token]);

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
      await API.put(`/blogs/${id}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Blog updated successfully!");
      navigate("/my-blogs");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to update blog!");
    }
  };

  return (
    <Container className="mt-4">
      <h2>Edit Blog</h2>
      <Form onSubmit={handleSubmit}>
        {/* Title */}
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        {/* Category Dropdown */}
        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Content */}
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

        {/* Publish Date */}
        <Form.Group className="mb-3">
          <Form.Label>Publish Date & Time</Form.Label>
          <InputGroup>
            <Form.Control
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() =>
                setPublishAt(new Date().toISOString().slice(0, 16))
              }
            >
              Now
            </Button>
          </InputGroup>
        </Form.Group>

        {/* Image */}
        <Form.Group className="mb-3">
          <Form.Label>Image (optional)</Form.Label>
          {preview && (
            <Image
              src={preview}
              fluid
              thumbnail
              className="mb-2"
              style={{ width: "200px", height: "150px", objectFit: "cover" }}
            />
          )}
          <Form.Control
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </Form.Group>

        {/* Submit Button */}
        <Button type="submit">Update Blog</Button>
      </Form>
    </Container>
  );
}
