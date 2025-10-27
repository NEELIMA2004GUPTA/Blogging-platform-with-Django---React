import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { jwtDecode } from "jwt-decode";
import { Navbar as BootstrapNavbar, Nav, NavDropdown, Container } from "react-bootstrap";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const [user, setUser] = useState(null);

  // Fetch logged-in user
  const fetchUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.log("Error fetching user:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Check admin
let isAdmin = false;
if (token) {
  try {
    const decoded = jwtDecode(token);
    // Use either token payload or fetched user info
    isAdmin =
      decoded?.is_admin || decoded?.role === "admin" || decoded?.is_staff || user?.is_admin;
  } catch (err) {
    console.warn("Invalid token:", err);
  }
}

  // Handle brand click
  const handleBrandClick = (e) => {
    e.preventDefault();
    navigate(token ? "/home" : "/");
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand href="/" onClick={handleBrandClick}>
          Blogging Platform
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* Always show Home */}
            <Nav.Link as={Link} to="/home">Home</Nav.Link>

            {token ? (
              <>
                <Nav.Link as={Link} to="/my-blogs">My Blogs</Nav.Link>
                <Nav.Link as={Link} to="/create-blog">Create Blog</Nav.Link>

                {isAdmin && (
                  <>
                    <Nav.Link as={Link} to="/admin">Admin Dashboard</Nav.Link>
                    <Nav.Link as={Link} to="/create-category">Create Category</Nav.Link>
                  </>
                )}

                <NavDropdown
                  title={
                    <>
                      <img
                        src={user?.profile_picture || "https://via.placeholder.com/30"}
                        alt="Profile"
                        style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "5px" }}
                      />
                      {user?.username || "Profile"}
                    </>
                  }
                  id="basic-nav-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/upload-profile">Upload Profile Picture</NavDropdown.Item>
                  <NavDropdown.Item>Username: {user?.username}</NavDropdown.Item>
                  <NavDropdown.Item>Email: {user?.email}</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
