import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import {LineChart,Line,AreaChart,Area,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,Legend,ResponsiveContainer,} from "recharts";

export default function AdminDashboard() {
  const token = localStorage.getItem("access");
  const [range, setRange] = useState("monthly");
  const [stats, setStats] = useState({});

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/stats/?range=${range}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin stats!");
    }
  }, [range, token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const COLORS = ["#8884d8", "#82ca9d", "#ff6961", "#ffc658", "#8dd1e1"];
  const topBlogs = (stats.blog_stats || [])
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <Container className="mt-4">
      <h2>Admin Dashboard</h2>

      {/* Top Stats */}
      <Row className="mt-3 g-3">
        <Col md={2}><Card className="p-3 text-center">Total Users: {stats.total_users || 0}</Card></Col>
        <Col md={2}><Card className="p-3 text-center">Total Blogs: {stats.total_blogs || 0}</Card></Col>
        <Col md={2}><Card className="p-3 text-center">Total Views: {stats.total_views || 0}</Card></Col>
        <Col md={2}><Card className="p-3 text-center">Total Likes: {stats.total_likes || 0}</Card></Col>
        <Col md={2}><Card className="p-3 text-center">Total Shares: {stats.total_shares || 0}</Card></Col>
      </Row>

      {/* Range Filter */}
      <Row className="mt-4 mb-2">
        <Col md={3}>
          <Form.Select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Users & Blogs Side by Side */}
      <Row className="mt-4">
        <Col md={6}>
          <h5>Users ({range})</h5>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.users_by_range || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Col>

        <Col md={6}>
          <h5>Blogs ({range})</h5>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.blogs_by_range || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </Col>
      </Row>

      {/* Category Stats - Stacked Bar */}
      <h5 className="mt-4">Category-wise Stats</h5>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={stats.category_stats || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total_views" stackId="a" fill="#8884d8" />
          <Bar dataKey="total_likes" stackId="a" fill="#82ca9d" />
          <Bar dataKey="total_shares" stackId="a" fill="#ff6961" />
        </BarChart>
      </ResponsiveContainer>

      {/* Top Blogs - Pie Chart */}
      <h5 className="mt-4">Top 5 Blogs by Views</h5>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={topBlogs}
            dataKey="views"
            nameKey="title"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            label={(entry) => entry.title}
          >
            {topBlogs.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Container>
  );
}

