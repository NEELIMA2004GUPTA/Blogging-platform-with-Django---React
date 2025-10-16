import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, Button, Form, ListGroup } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

export default function BlogDetail() {
  const { id } = useParams();
  const token = localStorage.getItem("access");

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Fetch blog from backend
  const fetchBlog = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/blogs/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBlog(res.data);
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to load blog!");
    }
  }, [id, token]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/blogs/${id}/comments/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setComments(res.data);
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to load comments!");
    }
  }, [id, token]);

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [fetchBlog, fetchComments]);

  // Like blog
  const handleLike = async () => {
    if (!token) return toast.error("Login to like!");
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/blogs/${id}/like/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBlog(); // re-fetch to get updated likes
      toast.success("Liked!");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to like!");
    }
  };

  // Share blog
  const handleShare = async () => {
    if (!token) return toast.error("Login to share!");
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/blogs/${id}/share/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBlog(); // re-fetch to get updated shares
      toast.success("Shared!");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to share!");
    }
  };

  // Post comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Login to comment!");
    if (!newComment.trim()) return toast.error("Cannot post empty comment");

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/blogs/${id}/comments/`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment("");
      await fetchComments(); // refresh comments
      await fetchBlog(); // update comment count in stats
      toast.success("Comment added!");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to post comment!");
    }
  };

  if (!blog) return <p>Loading...</p>;

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <Card.Title>{blog.title}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            {blog.category?.name} | By {blog.author.username}
          </Card.Subtitle>
          <Card.Text>{blog.content}</Card.Text>

          <div>
            <span>Likes: {blog.stats?.likes || 0}</span> |{" "}
            <span>Shares: {blog.stats?.shares || 0}</span> |{" "}
          </div>

          <div className="mt-3">
            <Button variant="primary" className="me-2" onClick={handleLike}>
              Like
            </Button>
            <Button variant="secondary" onClick={handleShare}>
              Share
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Comments</Card.Title>
          <ListGroup className="mb-3">
            {comments.length === 0 && <p>No comments yet.</p>}
            {comments.map((c) => (
              <ListGroup.Item key={c.id}>
                <strong>{c.author.username}:</strong> {c.content}
              </ListGroup.Item>
            ))}
          </ListGroup>

          {token && (
            <Form onSubmit={handleCommentSubmit}>
              <Form.Group className="mb-2">
                <Form.Control
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </Form.Group>
              <Button type="submit">Post Comment</Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
