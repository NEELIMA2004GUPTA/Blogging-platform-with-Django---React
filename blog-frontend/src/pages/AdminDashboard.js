import React, { useEffect, useState, useCallback } from "react";
import { Container, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const token = localStorage.getItem("access");

  // Wrap fetchStats in useCallback to satisfy eslint dependency
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/stats/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      toast.error("Failed to load stats!");
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // Now included in dependency array

  return (
    <Container className="mt-4">
      <h2>Admin Dashboard</h2>
      <Row className="mt-3">
        <Col md={4}>
          <Card className="p-3 text-center">Total Users: {stats.total_users || 0}</Card>
        </Col>
        <Col md={4}>
          <Card className="p-3 text-center">Total Blogs: {stats.total_blogs || 0}</Card>
        </Col>
        <Col md={4}>
          <Card className="p-3 text-center">Recent Activity: {stats.recent_activity || 0}</Card>
        </Col>
      </Row>

      <h5 className="mt-4">Posts by Category</h5>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats.posts_by_category || []}>
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Container>
  );
}
