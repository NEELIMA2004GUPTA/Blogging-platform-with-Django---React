import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Row, Col } from "react-bootstrap";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
      <h1 className="display-3 mb-4">Welcome to Our Blogging Platform</h1>
      <p className="lead mb-4">Read, create, and enjoy new ideas!</p>
      <Row className="mt-4">
        <Col>
          <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
            Login
          </Button>
        </Col>
        <Col>
          <Button variant="success" size="lg" onClick={() => navigate("/register")}>
            Register
          </Button>
        </Col>
      </Row>
    </Container>
  );
}
