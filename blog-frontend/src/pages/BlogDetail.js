import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, Button, Form, ListGroup, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import API from "../api/axios";

export default function BlogDetail() {
  const { id } = useParams();
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
    try {
      const res = await API.post(
        `/blogs/${blogId}/like/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update frontend instantly
      setBlog((prevBlog) => ({
        ...prevBlog,
        likes: res.data.likes,
        liked: true,
      }));;

      toast.success("You liked this blog!");
    } catch (err) {
      if (err.response?.status === 400) {
        toast.info(err.response.data.detail);
      } else if (err.response?.status === 403) {
        toast.warn(err.response.data.detail || "You cannot like your own blog");
      } else {
        toast.error("Something went wrong while liking");
      }
    }
  };

  // Share blog
  const handleShare = async () => {
    if (!token) return toast.error("Login to share!");
    try {
      await API.post(
        `/blogs/${id}/share/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    if (!token) return toast.error("Login to comment!");
    if (!newComment.trim()) return toast.error("Cannot post empty comment");

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

  if (!blog) return <p>Loading...</p>;

  
  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <Card.Title>{blog.title}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            {blog.category?.name} | By {blog.author.username}
          </Card.Subtitle>

          {/* Blog Image */}
          <Image src={blog.image_url || "https://via.placeholder.com/150"} fluid rounded className="mb-3" style={{width: "50%",height: "300px",objectFit: "cover"}} />

          <Card.Text>{blog.content}</Card.Text>

          <div className="d-flex gap-3">
            <span>Likes: {blog.stats?.likes || 0}</span>
            <span>Shares: {blog.stats?.shares || 0}</span>
          </div>
          
          <div className="mt-3">
            <Button
              variant={blog.liked ? "success" : "outline-primary"}
                disabled={blog.liked}
                onClick={() => handleLike(blog.id)} 
            >
            {blog.liked ? "Liked ❤️" : "Like 👍"}
            </Button>
            <Button variant="secondary" onClick={handleShare}>
              Share
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Comments */}
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
