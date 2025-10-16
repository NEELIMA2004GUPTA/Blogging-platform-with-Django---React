import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("auth/register/", form);
      toast.success("Registered successfully");
      navigate("/login");
    } 
    catch {
      toast.error("Registration failed");
    }
  };

  return (
    <div className="col-md-4 mx-auto">
      <h3>Register</h3>
      <form onSubmit={handleSubmit}>
        <input className="form-control mb-2" placeholder="Username" onChange={(e) => setForm({...form, username: e.target.value})}/>
        <input className="form-control mb-2" placeholder="Email" onChange={(e) => setForm({...form, email: e.target.value})}/>
        <input type="password" className="form-control mb-2" placeholder="Password" onChange={(e) => setForm({...form, password: e.target.value})}/>
        <input type="password" className="form-control mb-2" placeholder="Confirm Password" onChange={(e) => setForm({...form, password2: e.target.value})}/>
        <button className="btn btn-primary w-100">Register</button>
      </form>
    </div>
  );
}
