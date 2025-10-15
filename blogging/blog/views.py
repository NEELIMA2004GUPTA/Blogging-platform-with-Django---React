from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import DatabaseError, OperationalError

from .models import User, Blog , Category, Comment, BlogStats
from django.db.models import Sum

from .serializers import RegisterSerializer, UserSerializer,PasswordResetSerializer, PasswordResetConfirmSerializer, BlogSerializer, CategorySerializer, CommentSerializer, BlogStatsSerializer,MyTokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

# ! Register

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        except (DatabaseError, OperationalError):
            return Response(
                {"detail": "Database connection error. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


#! Login (returns JWT token)
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except (DatabaseError, OperationalError):
            return Response(
                {"detail": "Database connection error. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
# ! Logout

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist() 
        return Response({"message": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


# ! Current User Info

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ! Forgot password
@api_view(['POST'])
def password_reset_request(request):
    serializer = PasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "If this email exists, a reset link will be sent."}, status=status.HTTP_200_OK)
    
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    reset_link = f"http://127.0.0.1:8000/api/auth/reset-password-confirm/{uid}/{token}/"
    
    send_mail(
        subject="Password Reset",
        message=f"Click the link to reset your password: {reset_link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
    )
    
    return Response({"detail": "If this email exists, a reset link will be sent."}, status=status.HTTP_200_OK)

# ! Reset password
@api_view(['POST'])
def password_reset_confirm(request, uid, token):
    serializer = PasswordResetConfirmSerializer(data={**request.data, "uid": uid, "token": token})
    serializer.is_valid(raise_exception=True)
    
    try:
        user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
        user = User.objects.get(pk=user_id)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response({"detail": "Invalid UID"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not default_token_generator.check_token(user, serializer.validated_data['token']):
        return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    
    return Response({"detail": "Password reset successful"}, status=status.HTTP_200_OK)

# ! List all blogs / Create blog
@api_view(['GET', 'POST'])
def blogs_list_create(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            # Authenticated users: show published blogs + own blogs
            blogs = Blog.objects.filter(
                deleted_at__isnull=True
            ).filter(
                Q(is_published=True, publish_at__lte=timezone.now()) | 
                Q(author=request.user)
            )
        else:
            # Public users: only published blogs
            blogs = Blog.objects.filter(
                deleted_at__isnull=True,
                is_published=True,
                publish_at__lte=timezone.now()
            )

        # Search by title
        search_query = request.GET.get('search')
        if search_query:
            blogs = blogs.filter(title__icontains=search_query)

        # Filter by category
        category_name = request.GET.get('category')
        if category_name:
            blogs = blogs.filter(category__name__iexact=category_name)

        # Sorting
        sort_by = request.GET.get('sort', 'newest')
        if sort_by == 'newest':
            blogs = blogs.order_by('-publish_at')
        elif sort_by == 'oldest':
            blogs = blogs.order_by('publish_at')
        elif sort_by == 'title_asc':
            blogs = blogs.order_by('title')
        elif sort_by == 'title_desc':
            blogs = blogs.order_by('-title')

        # Pagination
        page_number = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        paginator = Paginator(blogs, page_size)
        page_obj = paginator.get_page(page_number)

        serializer = BlogSerializer(page_obj.object_list, many=True)

        return Response({
            'total_pages': paginator.num_pages,
            'current_page': page_obj.number,
            'total_blogs': paginator.count,
            'blogs': serializer.data
        })

    # POST: Create blog (authenticated)
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=401)

        serializer = BlogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# ! Get, Update, Delete single blog
@api_view(['GET', 'PUT', 'DELETE'])
def blog_detail(request, blog_id):
    # Fetch the blog and ensure it is not soft-deleted
    blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)

    # GET: Public can view if published
    if request.method == 'GET':
        if not blog.is_published or (blog.publish_at and blog.publish_at > timezone.now()):
            # Hide unpublished blog from public
            if not (request.user.is_authenticated and (request.user == blog.author or request.user.is_admin)):
                return Response({'detail': 'Blog not published yet'}, status=status.HTTP_403_FORBIDDEN)

        # Count no. of times post get viewed   
        stats, created = BlogStats.objects.get_or_create(blog=blog)

        if not (request.user.is_authenticated and request.user == blog.author):
            stats.views += 1
            stats.save()

        serializer = BlogSerializer(blog)
        return Response(serializer.data)

    # PUT: Only author or admin can update
    elif request.method == 'PUT':
        if not request.user.is_authenticated or (request.user != blog.author and not request.user.is_admin):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BlogSerializer(blog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE: Soft delete, only author or admin
    elif request.method == 'DELETE':
        if not request.user.is_authenticated or (request.user != blog.author and not request.user.is_admin):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        blog.soft_delete()
        return Response({'detail': 'Blog deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    

# ! List all categories / Create category
@api_view(['GET', 'POST'])
def categories_list_create(request):
    # GET: Public can view categories
    if request.method == 'GET':
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    # POST: Only admin can create
    elif request.method == 'POST':
        if not request.user.is_authenticated or not request.user.is_admin:
            return Response({'detail': 'Admin privileges required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ! Retrieve / Update / Delete single category
@api_view(['GET', 'PUT', 'DELETE'])
def category_detail(request, category_id):
    category = get_object_or_404(Category, id=category_id)

    # GET: anyone can view
    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    # PUT / DELETE: only admin
    if not request.user.is_authenticated or not request.user.is_admin:
        return Response({'detail': 'Admin privileges required'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        category.delete()
        return Response({'detail': 'Category deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# ! List comments for a blog / Create comment

@api_view(['GET', 'POST'])
def blog_comments(request, blog_id):
    blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)

    # GET: list comments for this blog (exclude soft-deleted)
    if request.method == 'GET':
        comments = blog.comments.filter(deleted_at__isnull=True)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    # POST: create a comment (authenticated)
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        data = request.data.copy()
        data['blog'] = blog.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(author=request.user, blog=blog)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ! Delete comment (soft delete)

@api_view(['GET', 'DELETE'])
def comment_detail(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id, deleted_at__isnull=True)

    if request.method == 'GET':
        serializer = CommentSerializer(comment)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        # Only author or admin can delete
        if not request.user.is_authenticated or (request.user != comment.author and not request.user.is_admin):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        comment.soft_delete()
        return Response({'detail': 'Comment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# ! Likes   
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_like(request, blog_id):
    blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)

    # You can optionally prevent author liking their own blog
    if request.user == blog.author:
        return Response({'detail': "Authors cannot like their own blog"}, status=403)
    
    stats, created = BlogStats.objects.get_or_create(blog=blog)
    blog.stats.likes += 1
    blog.stats.save()
    return Response({'likes': blog.stats.likes}, status=200)

# ! Share 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_share(request, blog_id):
    blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)

    blog.stats.shares += 1
    blog.stats.save()
    return Response({'shares': blog.stats.shares}, status=200)

# ! Get stats of a blog
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    # Only admin users can access
    if not request.user.is_staff:  
        return Response({'detail': 'Admin privileges required'}, status=403)
    
    blog_id = request.query_params.get('blog_id', None)

   
    if blog_id:
        blog_id = blog_id.rstrip('/')
        try:
            blog_id = int(blog_id)  # convert string to int
        except ValueError:
            return Response({'detail': 'blog_id must be an integer'}, status=400)
        # Fetch stats for a single blog
        blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)
        stats = getattr(blog, 'stats', None)  
        if stats:
            data = {
                'blog_id': blog.id,
                'title': blog.title,
                'views': stats.views,
                'likes': stats.likes,
                'shares': stats.shares
            }
        else:
            data = {
                'blog_id': blog.id,
                'title': blog.title,
                'views': 0,
                'likes': 0,
                'shares': 0
            }
    else:
        # Global stats
        total_users = User.objects.count()
        total_blogs = Blog.objects.filter(deleted_at__isnull=True).count()

        stats_agg = BlogStats.objects.aggregate(
            total_views=Sum('views'),
            total_likes=Sum('likes'),
            total_shares=Sum('shares')
        )

        data = {
            'total_users': total_users,
            'total_blogs': total_blogs,
            'total_views': stats_agg['total_views'] or 0,
            'total_likes': stats_agg['total_likes'] or 0,
            'total_shares': stats_agg['total_shares'] or 0,
        }

    return Response(data)