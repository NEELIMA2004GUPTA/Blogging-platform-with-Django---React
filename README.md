# 📝 Blogging Platform - Full Stack Web Application
A **Full Stack Blogging Platform** built using **Django REST Framework (Backend)** and **React.js (Frontend)**.  
This platform allows users to **register, create, edit, delete, like, and share blogs**, while admins can manage users, categories, and monitor analytics.

--------------
## 🚀 Tech Stack

### 🖥️ Frontend
- React.js 
- React Bootstrap
- Axios (for API integration)
- React Toastify (notifications)
- React Router (navigation)

### ⚙️ Backend
- Django 
- Django REST Framework
- Simple JWT (for authentication)
- MySql (database)
- Ngrok (for local API tunneling)
- Django Email Backend (for password reset)

-------------
## 📂 Folder Structure

project_root/
│
├── backend/
│ ├── manage.py
│ ├── requirements.txt
│ ├── blogging/
│ │ ├── models.py
│ │ ├── serializers.py
│ │ ├── views.py
│ │ ├── urls.py
│ │ └── permissions.py
│ └── blogging_platform/
│ ├── settings.py
│ ├── urls.py
│ └── wsgi.py
│
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── api
│ │ └── App.js
│ └── package.json

----------------
## 🧩 Features

### 👥 User Authentication
- JWT-based Register / Login / Logout
- View user profile
- Upload profile picture
- Password reset via email with secure token

### 📰 Blog Management
- Create, edit, and soft delete blogs
- Draft or publish with future scheduling (`publish_at`)
- View all blogs with:
  - Pagination
  - Search by title
  - Filter by category
  - Sort by date/title
- View single blog with stats (views, likes, shares, comments)

### 💬 Comments
- Add, view, and delete comments (soft delete)
- Only comment author or admin can delete

### ❤️ Likes & 🔗 Shares
- Authenticated users can like others’ blogs
- Prevent authors from liking their own posts
- Track total likes, views, and shares per blog

### 📊 Admin Analytics
Accessible to admin users only:
- Total users, blogs, likes, shares, views
- User registration trends (daily/weekly/monthly)
- Blog publishing trends
- Category-wise performance (likes, views, shares)
- Top 5 most viewed blogs

### 🗃️ Categories
- Public can view all categories
- Admin can add, edit, delete categories

----------------
## ⚡ API Endpoints

|       Endpoint                                    |       Method       |           Description           |        Auth      |
|---------------------------------------------------|--------------------|---------------------------------|------------------|
|           `/api/auth/register/`                   | POST               | Register new user               | ❌              |
|           `/api/auth/login/`                      | POST               | Login user (returns JWT tokens) | ❌              |
|           `/api/auth/logout/`                     | POST               | Logout and blacklist token      | ✅              |
|           `/api/auth/me/`                         | GET                | Get current user info           | ✅              |
|           `/api/auth/password-reset/              | POST               | Send password reset email       | ❌              |
| `/api/auth/reset-password-confirm/<uid>/<token>/` | POST               | Reset password                  | ❌              |
|       `/api/auth/upload-profile-picture/`         | PUT                | Upload profile picture          | ✅              |
|            `/api/blogs/`                          | GET, POST          | List / Create blogs             | ✅ (POST)       |
|           `/api/blogs/<id>/`                      | GET, PUT, DELETE   | Retrieve / Update / Delete blog | ✅ (PUT/DELETE) |
|          `/api/categories/`                       | GET, POST          | List / Create category          | ✅ (Admin)      |
|         `/api/categories/<id>/`                   | GET, PUT, DELETE   | Manage category                 | ✅ (Admin)      |
|        `/api/blogs/<id>/comments/`                | GET, POST          | List / Add comments             | ✅ (POST)       |
|         `/api/comments/<id>/`                     | GET, DELETE        | View / Delete comment           | ✅              |
|        `/api/blogs/<id>/like/`                    | POST               | Like a blog                     | ✅              |
|       `/api/blogs/<id>/share/`                    | POST               | Share a blog                    | ✅              |
|       `/api/stats/`                               | GET                | Platform-wide analytics         | ✅ (Admin)      |

------------
## 🧠 Key Concepts Implemented

- **JWT Authentication** with refresh and access tokens  
- **Soft Delete** (blogs and comments)
- **Ngrok Integration** for public API testing
- **Pagination, Filtering, and Sorting**
- **DRF Serializers & Permissions**
- **Email-based Password Reset**
- **Admin Dashboard Analytics using `TruncMonth`, `Coalesce`, `Sum`, `Count`**
--------------

## 🛠️ Setup Instructions

1️⃣ Backend Setup
python -m venv venv
venv\Scripts\activate   # On Windows
source venv/bin/activate  # On Mac/Linux
cd blogging

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

2️⃣ Frontend Setup
cd blog-frontend
npm install
npm start

3️⃣ Ngrok Setup (for local API testing)
ngrok http 8000
Copy the generated URL (e.g. https://<your-ngrok>.ngrok-free.dev)
and update it in your frontend axios.js as baseURL.

---------------
⚙️ Environment Variables
Create a .env file in your backend root:

For Email setup
SECRET_KEY=your_secret_key
DEBUG=True
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com

For database setup
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
-------------------

🧾 API Authentication Flow
User logs in → Receives access and refresh tokens
access token is sent in headers:
    Authorization: Bearer <access_token>
If token expires → Use refresh token to get a new access token
On logout → Token is blacklisted

-----------------
***HAPPY CODING***
