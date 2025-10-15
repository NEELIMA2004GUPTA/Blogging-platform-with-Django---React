from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
from blog.serializers import (UserSerializer, RegisterSerializer, MyTokenObtainPairSerializer,PasswordResetSerializer, PasswordResetConfirmSerializer,CategorySerializer, CommentSerializer, BlogStatsSerializer,BlogSerializer, validate_image)
from .models import User, Blog, Category, Comment, BlogStats


User = get_user_model()

# ! Test case for models

class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(username='testuser',email='test@example.com',password='testpass123',profile_picture=None)
        self.assertEqual(str(user), 'testuser')
        self.assertFalse(user.is_admin)
        self.assertEqual(user.email, 'test@example.com')

class CategoryModelTest(TestCase):
    def test_create_category(self):
        category = Category.objects.create(name='Technology', description='Tech news and tutorials')
        self.assertEqual(str(category), 'Technology')
        self.assertEqual(category.description, 'Tech news and tutorials')

class BlogModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='blogger', email='blogger@example.com', password='pass123')
        self.category = Category.objects.create(name='Travel', description='Travel stories')

    def test_blog_creation_and_defaults(self):
        blog = Blog.objects.create(title='My First Blog',content='This is the content of my first blog.',author=self.user,category=self.category)

        self.assertEqual(str(blog), 'My First Blog')
        self.assertFalse(blog.is_published)
        self.assertIsNone(blog.deleted_at)
        self.assertEqual(blog.author.username, 'blogger')
        self.assertEqual(blog.category.name, 'Travel')

    def test_blog_soft_delete(self):
        blog = Blog.objects.create(title='Soft Delete Test',content='Will be soft deleted',author=self.user,category=self.category)
        blog.soft_delete()
        self.assertIsNotNone(blog.deleted_at)

    def test_blog_auto_publish(self):
        # Blog scheduled in past should be auto-published
        blog = Blog.objects.create(title='Scheduled Blog',content='This should publish immediately',author=self.user,category=self.category,publish_at=timezone.now() - timezone.timedelta(days=1))
        self.assertTrue(blog.is_published)

class CommentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='commenter', email='commenter@example.com', password='pass123')
        self.category = Category.objects.create(name='Science', description='Science related content')
        self.blog = Blog.objects.create(title='Science Blog',content='Content about science',author=self.user,category=self.category)

    def test_comment_creation(self):
        comment = Comment.objects.create(blog=self.blog, author=self.user, content='Nice article!')
        self.assertEqual(str(comment), f"{self.user.username} on {self.blog.title}")
        self.assertIsNone(comment.deleted_at)
        self.assertEqual(comment.blog, self.blog)

    def test_comment_soft_delete(self):
        comment = Comment.objects.create(blog=self.blog, author=self.user, content='Will delete soon')
        comment.soft_delete()
        self.assertIsNotNone(comment.deleted_at)

class BlogStatsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='statsuser', email='stats@example.com', password='pass123')
        self.category = Category.objects.create(name='Lifestyle', description='Lifestyle tips')

    def test_blogstats_auto_created(self):
        blog = Blog.objects.create(title='Stats Test Blog',content='Testing stats creation',author=self.user,category=self.category)
        # Signal should automatically create BlogStats
        self.assertTrue(hasattr(blog, 'stats'))
        self.assertIsInstance(blog.stats, BlogStats)
        self.assertEqual(blog.stats.views, 0)
        self.assertEqual(blog.stats.likes, 0)
        self.assertEqual(blog.stats.shares, 0)
        self.assertEqual(str(blog.stats), f"Stats for {blog.title}")

    
# ! Test case for serializers
class SerializerTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username='testuser',email="test123@gmail.com", password='pass')
        cls.category = Category.objects.create(name='Tech')
        cls.blog = Blog.objects.create(title='Test Blog', content='Content', author=cls.user, category=cls.category)
        cls.comment = Comment.objects.create(blog=cls.blog, author=cls.user, content='Nice blog!')
  
    # UserSerializer 
    def test_user_serializer_fields(self):
        serializer = UserSerializer(self.user)
        self.assertIn('username', serializer.data)
        self.assertIn('email', serializer.data)

    # RegisterSerializer
    def test_register_serializer_valid(self):
        data = {
            "username": "newuser",
            "email": "newuser@test.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!"
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_register_serializer_password_mismatch(self):
        data = {
            "username": "mismatch",
            "email": "mismatch@test.com",
            "password": "Password123!",
            "password2": "MismatchPass"
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    # Token Serializer
    def test_my_token_obtain_pair_serializer(self):
        serializer = MyTokenObtainPairSerializer.get_token(self.user)
        self.assertIn('username', serializer)
        self.assertIn('email', serializer)

     # Password Reset Serializers
    def test_password_reset_serializer(self):
        data = {"email": "test123@gmail.com"}
        serializer = PasswordResetSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_password_reset_confirm_serializer(self):
        data = {
            "uid": "123",
            "token": "abc",
            "new_password": "StrongPass123!"
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    # Category Serializer
    def test_category_serializer(self):
        serializer = CategorySerializer(self.category)
        self.assertEqual(serializer.data['name'], "Tech")

    # Comment Serializer
    def test_comment_serializer(self):
        serializer = CommentSerializer(self.comment)
        self.assertEqual(serializer.data['content'], "Nice blog!")

    # BlogStats Serializer
    def test_blog_stats_serializer(self):
        stats = self.blog.stats  # automatically created by signal
        stats.views = 10
        stats.likes = 2
        stats.shares = 2
        stats.save()

        serializer = BlogStatsSerializer(stats)
        self.assertEqual(serializer.data['views'], 10)
        self.assertEqual(serializer.data['likes'], 2)
        self.assertEqual(serializer.data['shares'], 2)

     # Blog Serializer
    def test_blog_serializer_read(self):
        serializer = BlogSerializer(self.blog)
        self.assertEqual(serializer.data['title'], "Test Blog")
        self.assertEqual(serializer.data['category']['name'], "Tech")

    def test_blog_serializer_create(self):
        data = {
            "title": "New Blog",
            "content": "New Content",
            "category_name": "Science",
        }
        serializer = BlogSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        blog = serializer.save(author=self.user)
        self.assertEqual(blog.category.name, "Science")

    def test_blog_serializer_update(self):
        data = {"title": "Updated Blog", "category_name": "UpdatedCat"}
        serializer = BlogSerializer(instance=self.blog, data=data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_blog = serializer.save()
        self.assertEqual(updated_blog.title, "Updated Blog")
        self.assertEqual(updated_blog.category.name, "UpdatedCat")
    
    # File Validation
    def test_validate_image_valid(self):
        file = SimpleUploadedFile("test.png", b"file_content", content_type="image/png")
        try:
            validate_image(file)
        except ValidationError:
            self.fail("validate_image() raised ValidationError unexpectedly!")
    
    def test_validate_image_invalid_type(self):
        file = SimpleUploadedFile("test.txt", b"content", content_type="text/plain")
        with self.assertRaises(ValidationError):
            validate_image(file)

    def test_validate_image_large_size(self):
        file = SimpleUploadedFile("big.png", b"x" * (6 * 1024 * 1024), content_type="image/png")
        with self.assertRaises(ValidationError):
            validate_image(file)

# ! Test case for views
class BlogAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Users
        cls.admin = User.objects.create_superuser(username="admin",email="admin@example.com",password="adminpass")

        cls.user = User.objects.create_user(username="user1",email="user1@example.com",password="pass123")
        
        # Category
        cls.category = Category.objects.create(name="Tech")

        # Blog
        cls.blog = Blog.objects.create(
            title="Test Blog",
            content="Content",
            author=cls.user,
            category=cls.category,
            is_published=True,
            publish_at=timezone.now()
        )

        # Ensure stats exists
        cls.stats = getattr(cls.blog, 'stats', None)
        if cls.stats is None:
            cls.stats = BlogStats.objects.create(blog=cls.blog, views=5, likes=2, shares=1)

        # Comment
        cls.comment = Comment.objects.create(blog=cls.blog, author=cls.user, content="Nice blog!")

    # USER AUTH
    def test_register_login_logout(self):
        url = reverse('register') 
        data = {"username": "newuser","email": "newuser@test.com","password": "newpass123!","password2": "newpass123!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Login
        url_login = reverse('token_obtain_pair')  
        data_login = {"username": "newuser", "password": "newpass123!"}
        response_login = self.client.post(url_login, data_login)
        self.assertIn("access", response_login.data)
        token = response_login.data['access']

        # Logout with refresh token
        refresh_token = response_login.data.get('refresh', '')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        url_logout = reverse('logout')
        response_logout = self.client.post(url_logout, {"refresh": refresh_token})
        self.assertEqual(response_logout.status_code, status.HTTP_205_RESET_CONTENT)

    # BLOG CRUD
    def test_get_blogs_list(self):
        url = reverse('blogs-list-create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['blogs']) >= 1)

    def test_create_blog_authenticated(self):
        url = reverse('blogs-list-create')
        self.client.force_authenticate(user=self.user)
        data = {
            "title": "New Blog",
            "content": "Blog content",
            "category_name": self.category.name
            }
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_blog_like_share_stats(self):
        # Like
        url_like = reverse('blog-like', args=[self.blog.id])
        self.client.force_authenticate(user=self.admin) 

        # Capture initial likes
        initial_likes = self.blog.stats.likes

        response_like = self.client.post(url_like)
        self.assertEqual(response_like.status_code, status.HTTP_200_OK)
        self.assertEqual(response_like.data['likes'], initial_likes + 1)

        # Refresh stats from DB for share
        self.blog.stats.refresh_from_db()
        initial_shares = self.blog.stats.shares

        # Share
        url_share = reverse('blog-share', args=[self.blog.id])
        response_share = self.client.post(url_share)
        self.assertEqual(response_share.status_code, status.HTTP_200_OK)
        self.assertEqual(response_share.data['shares'], initial_shares + 1)

    # COMMENT
    def test_create_comment(self):
        url = reverse('blog-comments', args=[self.blog.id])
        self.client.force_authenticate(user=self.admin)
        data = {"content": "Admin comment"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], "Admin comment")

    # BLOG STATS
    def test_admin_stats_endpoint(self):
        url = reverse('admin-stats')
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_blogs', response.data)
        self.assertIn('total_views', response.data)
        self.assertIn('total_likes', response.data)
        self.assertIn('total_shares', response.data)