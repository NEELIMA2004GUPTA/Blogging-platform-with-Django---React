// src/components/AdminRoute.js
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";

export default function AdminRoute() {
  const token = localStorage.getItem("access");
  const [isAdmin, setIsAdmin] = useState(null); // null = loading

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAdmin(res.data.is_admin || res.data.role === "admin" || res.data.is_staff);
      } catch (err) {
        console.log("Error fetching user:", err);
        setIsAdmin(false);
      }
    };
    fetchUser();
  }, [token]);

  if (isAdmin === null) return <p>Loading...</p>;
  return isAdmin ? <Outlet /> : <Navigate to="/home" />;
}
