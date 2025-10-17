import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navigation from "./components/Navbar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import CreateBlog from "./pages/CreateBlog";
import MyBlogs from "./pages/MyBlogs";
import AdminDashboard from "./pages/AdminDashboard";
import BlogDetail from "./pages/BlogDetail";
import CreateCategory from "./pages/CreateCategory";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EditBlog from "./pages/EditBlog";
import ProfilePictureUpload from "./pages/ProfilePictureUpload";

function App() {
  const token = localStorage.getItem("access");

  return (
    <Router>
      <Navigation />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={!token ? <Landing /> : <Navigate to="/home" />} />

        {/* Home page */}
        <Route path="/home" element={<Home />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/my-blogs" element={<MyBlogs />} />
          <Route path="/create-blog" element={<CreateBlog />} />
          <Route path="/edit-blog/:id" element={<EditBlog />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/upload-profile" element={<ProfilePictureUpload />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/create-category" element={<CreateCategory />} />
        </Route>

        {/* Blog Detail */}
        <Route path="/blogs/:id" element={<BlogDetail />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
