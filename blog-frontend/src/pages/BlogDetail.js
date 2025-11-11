import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, ListGroup, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import API from "../api/axios";

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Fetch blog
  const fetchBlog = useCallback(async () => {
    try {
      const res = await API.get(`/blogs/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBlog(res.data);
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to load blog!");
    }
  }, [id, token]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await API.get(`/blogs/${id}/comments/`, {
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
  const handleLike = async (blogId) => {
    if (!token) return toast.info("Please login to like posts!");
    try {
      const res = await API.post(
        `/blogs/${blogId}/like/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlog((prevBlog) => ({
        ...prevBlog,
        stats: { ...prevBlog.stats, likes: res.data.likes },
        liked: true,
      }));
      toast.success("You liked this blog!");
    } catch (err) {
      if (err.response?.status === 400) toast.info(err.response.data.detail);
      else if (err.response?.status === 403) toast.warn("You cannot like your own blog");
      else toast.error("Something went wrong while liking");
    }
  };

  // Share blog
  const handleShare = async () => {
    if (!token) return toast.info("Please login to share!");
    try {
      await API.post(`/blogs/${id}/share/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchBlog();
      toast.success("Shared!");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to share!");
    }
  };

  // Post comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.info("Please login to comment!");
    if (!newComment.trim()) return toast.warning("Comment cannot be empty!");

    try {
      await API.post(
        `/blogs/${id}/comments/`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment("");
      await fetchComments();
      await fetchBlog();
      toast.success("Comment added!");
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to post comment!");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await API.delete(`/blogs/comments/${commentId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Comment deleted!");
      await fetchComments();
      await fetchBlog();
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to delete comment!");
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

          {blog.image_url && !blog.image_url.includes("via.placeholder.com") && (
            <img
              src={blog.image}
              className="img-fluid rounded"
              style={{ width: "50%", height: "300px", objectFit: "cover" }}
            />
          )}

          <Card.Text>{blog.content}</Card.Text>

          <div className="d-flex gap-3 mb-2">
            <span>Likes: {blog.stats?.likes || 0}</span>
            <span>Shares: {blog.stats?.shares || 0}</span>
          </div>

          <div className="d-flex gap-3">
            <Button
              variant={blog.liked ? "success" : "outline-primary"}
              disabled={!token || blog.liked}
              onClick={() => handleLike(blog.id)}
            >
              {token ? (blog.liked ? "Liked ❤️" : "Like 👍") : "Login to Like"}
            </Button>

            <Button variant="secondary" disabled={!token} onClick={handleShare}>
              {token ? "Share" : "Login to Share"}
            </Button>
          </div>

          {!token && (
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>
              Please{" "}
              <span
                className="text-primary"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                login
              </span>{" "}
              to like, comment, or share this post.
            </p>
          )}
        </Card.Body>
      </Card>

      {/* Comments Section */}
      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Comments</Card.Title>
          <ListGroup className="mb-3">
            {comments.length === 0 && <p>No comments yet.</p>}
            {comments.map((c) => (
              <ListGroup.Item
                key={c.id}
                className="d-flex justify-content-between align-items-center"
                style={{ display: "flex", alignItems: "center" }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{c.author.username}:</strong> {c.content}
                </div>

                {/* Delete button visible only for comment author, blog author, or admin */}
                {token &&
                  (c.author.username === blog.current_user ||
                    blog.author.username === blog.current_user ||
                    blog.is_admin) && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      style={{ marginLeft: "10px", whiteSpace: "nowrap" }}
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      Delete
                    </Button>
                  )}
              </ListGroup.Item>
            ))}
          </ListGroup>

          {token ? (
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
          ) : (
            <p className="text-muted">
              Please{" "}
              <span
                onClick={() => navigate("/login")}
                style={{ color: "blue", cursor: "pointer" }}
              >
                login
              </span>{" "}
              to comment on this post.
            </p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
