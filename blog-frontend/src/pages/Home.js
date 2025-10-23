import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Form, Dropdown, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/axios";

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories/");
      const cats = Array.isArray(res.data) ? res.data : res.data?.categories || [];
      setCategories(cats);
    } catch (err) {
      toast.error("Failed to load categories!");
      console.error(err);
    }
  };

  const fetchBlogs = useCallback(async (page = 1, searchTerm = "") => {
    try {
      let url = `/blogs/?sort=${sortOrder}&page=${page}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (searchTerm) url += `&search=${searchTerm}`;

      const res = await API.get(url);
      const data = res.data;

      // If backend returns 'results', 'count', 'next', 'previous'
      const blogsArray = data.results || data.blogs || [];
      const blogsWithStats = blogsArray.map(blog => ({
        ...blog,
        stats: blog.stats || { likes: 0, shares: 0 }
      }));

      setBlogs(blogsWithStats);

      // Calculate total pages from backend count and page_size
      if (data.count && data.page_size) {
        setTotalPages(Math.ceil(data.count / data.page_size));
      } else if (data.total_pages) {
        setTotalPages(data.total_pages);
      } else {
        setTotalPages(1);
      }

      setCurrentPage(page);
    } catch (err) {
      toast.error("Failed to load blogs!");
      console.error(err);
    }
  }, [selectedCategory, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs(currentPage, searchQuery);
  }, [fetchBlogs, selectedCategory, sortOrder, currentPage]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setCurrentPage(1); // reset to first page on search
      fetchBlogs(1, value);
    }, 500);

    setTypingTimeout(timeout);
  };

  const handlePageClick = (page) => {
    if (page !== currentPage) setCurrentPage(page);
  };

  // Render pagination component
  const renderPagination = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageClick(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return <Pagination>{items}</Pagination>;
  };

  return (
    <Container className="mt-4">
      <Row>
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
            {categories.map(cat => (
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

        <Col md={9}>
          <Form className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </Form>

          <Row>
            {blogs.length === 0 && <p>No blogs available!</p>}
            {blogs.map(blog => (
              <Col md={12} key={blog.id} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title>{blog.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {blog.category?.name || "No category"} | By {blog.author?.username || "Unknown"}
                    </Card.Subtitle>
                    <div>
                      Likes: {blog.stats?.likes || 0} | Shares: {blog.stats?.shares || 0}
                    </div>
                    <Button className="mt-2" onClick={() => navigate(`/blogs/${blog.id}`)}>
                      Read More
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="d-flex justify-content-center mt-3">
            {renderPagination()}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
