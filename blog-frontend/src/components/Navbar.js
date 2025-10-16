import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ✅ correct import
import {
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Container,
} from "react-bootstrap";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const [user, setUser] = useState(null);

  // ✅ Wrap fetchUser in useCallback to fix the dependency warning
  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.log("Error fetching user:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUser();
  }, [token, fetchUser]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ✅ Safely decode token and check admin role
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded?.is_admin || decoded?.role === "admin" || decoded?.is_staff;
    } catch (err) {
      console.warn("Invalid token:", err);
    }
  }

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Blogging Platform
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {token ? (
              <>
                <Nav.Link as={Link} to="/home">
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/my-blogs">
                  My Blogs
                </Nav.Link>
                <Nav.Link as={Link} to="/create">
                  Create Blog
                </Nav.Link>

                {isAdmin && (
                  <>
                    <Nav.Link as={Link} to="/admin">
                      Admin Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/create-category">
                      Create Category
                    </Nav.Link>
                  </>
                )}

                <NavDropdown
                  title={
                    <>
                      <img
  src={
    user?.profile_picture
      ? `http://127.0.0.1:8000${user.profile_picture}`
      : "https://via.placeholder.com/30"
  }
  alt="Profile"
  style={{
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    marginRight: "5px",
  }}
/>
                      {user?.username || "Profile"}
                    </>
                  }
                  id="basic-nav-dropdown"
                >
                  <NavDropdown.Item>
                    Username: {user?.username}
                  </NavDropdown.Item>
                  <NavDropdown.Item>Email: {user?.email}</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
