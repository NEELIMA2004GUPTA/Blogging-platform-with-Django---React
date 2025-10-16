import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  let user = null;

  try {
    const userString = localStorage.getItem("user");
    if (userString) {
      user = JSON.parse(userString); // safe parsing
    }
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    user = null;
  }

  
  const isAdmin = user?.is_staff || false;
  return isAdmin ? <Outlet /> : <Navigate to="/home" />;
}
