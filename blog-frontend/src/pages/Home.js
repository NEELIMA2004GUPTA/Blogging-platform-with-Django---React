import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Form, Dropdown } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/categories/");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories!");
    }
  };

  const fetchBlogs = useCallback(async () => {
    try {
      let url = `http://127.0.0.1:8000/api/blogs/?sort=${sortOrder}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const res = await axios.get(url);
      // Ensure we have stats object for each blog to avoid undefined errors
      const blogsWithStats = res.data.blogs?.map(blog => ({
        ...blog,
        stats: blog.stats || { likes: 0, shares: 0 }
      })) || [];
      setBlogs(blogsWithStats);
    } catch (err) {
      toast.error("Failed to load blogs!");
    }
  }, [selectedCategory, searchQuery, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <Container className="mt-4">
      <Row>
        {/* Left sidebar - categories */}
        <Col md={3}>
          <h5>Categories</h5>
          <ListGroup>
            <ListGroup.Item
              action
              active={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </ListGroup.Item>
            {categories.map((cat) => (
              <ListGroup.Item
                key={cat.id}
                action
                active={selectedCategory === cat.name}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </ListGroup.Item>
            ))}
          </ListGroup>

          {/* Sorting */}
          <h6 className="mt-4">Sort By</h6>
          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              {sortOrder === "newest"
                ? "Newest"
                : sortOrder === "oldest"
                ? "Oldest"
                : sortOrder === "title_asc"
                ? "Title A-Z"
                : "Title Z-A"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setSortOrder("newest")}>Newest</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortOrder("oldest")}>Oldest</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortOrder("title_asc")}>Title A-Z</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortOrder("title_desc")}>Title Z-A</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>

        {/* Right side - blogs */}
        <Col md={9}>
          {/* Search bar */}
          <Form className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Form>

          <Row>
            {blogs.length === 0 && <p>No blogs available!</p>}
            {blogs.map((blog) => (
              <Col md={12} key={blog.id} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title>{blog.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {blog.category?.name} | By {blog.author.username}
                    </Card.Subtitle>
                    <Card.Text>{blog.content.substring(0, 150)}...</Card.Text>
                    <div>
                      Likes: {blog.stats.likes} | Shares: {blog.stats.shares}
                    </div>
                    <Button
                      className="mt-2"
                      onClick={() => navigate(`/blogs/${blog.id}`)}
                    >
                      Read More
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}
