import React, { useState } from "react";
import { Form, Button, Container, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import API from "../api/axios";

export default function ProfilePictureUpload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const token = localStorage.getItem("access");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed formats
    const allowedFormats = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedFormats.includes(file.type)) {
      toast.error("Only JPG, JPEG, and PNG files are allowed!");
      return;
    }

    // Max size (2MB)
    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSize) {
      toast.error("File size should not exceed 2 MB!");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!image) return toast.error("Please select a valid image first!");

    const formData = new FormData();
    formData.append("profile_picture", image);

    try {
      await API.put("/auth/upload-profile-picture/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile picture updated successfully!");
      window.location.reload();
    } catch (err) {
      console.log(err.response?.data);
      toast.error("Failed to upload profile picture!");
    }
  };

  return (
    <Container className="mt-4 text-center">
      <h2>Upload Profile Picture</h2>
      <Form onSubmit={handleUpload}>
        <Form.Group className="mb-3">
          <Form.Control
            type="file"
            onChange={handleImageChange}
            accept="image/*"
          />
        </Form.Group>
        {preview && (
          <Image
            src={preview}
            thumbnail
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
            className="mb-3"
          />
        )}
        <Button type="submit">Upload</Button>
      </Form>
    </Container>
  );
}
