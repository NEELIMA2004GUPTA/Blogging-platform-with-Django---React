from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.decorators import api_view, permission_classes,parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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
from rest_framework.permissions import IsAdminUser
from django.db.models import Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncQuarter, TruncYear
from django.db.models.functions import Coalesce


from .models import User, Blog , Category, Comment, BlogStats
from django.db.models import Sum

from .serializers import RegisterSerializer, UserSerializer,PasswordResetSerializer, PasswordResetConfirmSerializer, BlogSerializer, CategorySerializer, CommentSerializer, BlogStatsSerializer, LoginSerializer
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
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin,
        },
        'access': str(refresh.access_token),
        'refresh': str(refresh)
    }, status=status.HTTP_200_OK)


# ! logout 
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
    
    reset_link = f"https://omar-heady-paulina.ngrok-free.dev/reset-password/{uid}/{token}"
    
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

# ! Upload Profile Picture 
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_picture(request):
    user = request.user
    if 'profile_picture' not in request.FILES:
        return Response({'error': 'No image uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    user.profile_picture = request.FILES['profile_picture']
    user.save()
    return Response({'message': 'Profile picture updated successfully!', 'profile_picture': user.profile_picture.url})

# ! List all blogs / Create blog
@api_view(['GET', 'POST'])
@parser_classes([JSONParser,MultiPartParser, FormParser])
def blogs_list_create(request):
    if request.method == 'GET':
        if request.GET.get('mine') == 'true' and request.user.is_authenticated:
            # Only blogs created by logged-in user
            blogs = Blog.objects.filter(author=request.user, deleted_at__isnull=True)
        else:
            if request.user.is_authenticated:
                blogs = Blog.objects.filter(
                    deleted_at__isnull=True
                ).filter(
                    Q(is_published=True, publish_at__lte=timezone.now()) | 
                    Q(author=request.user)
                )
            else:
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

        serializer = BlogSerializer(page_obj.object_list, many=True, context={'request': request})

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
@parser_classes([JSONParser,MultiPartParser, FormParser])
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

        serializer = BlogSerializer(blog,context={'request': request})
        data = serializer.data

        # Always include public stats
        stats, _ = BlogStats.objects.get_or_create(blog=blog)
        data['stats'] = {
            "views": stats.views,
            "likes": stats.likes,
            "shares": stats.shares,
            "comments": blog.comments.filter(deleted_at__isnull=True).count()
        }

        return Response(data)

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
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def comment_detail(request, comment_id):
    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return Response({"detail": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

    # Allow only comment author, blog author, or admin
    if (
        request.user == comment.author or
        request.user == comment.blog.author or
        request.user.is_staff
    ):
        comment.delete()
        return Response({"detail": "Comment deleted"}, status=status.HTTP_204_NO_CONTENT)
    else:
        return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

# ! Likes   
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_like(request, blog_id):
    blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)

    # Prevent author from liking their own blog
    if request.user == blog.author:
        return Response({'detail': "Authors cannot like their own blog"}, status=403)

    stats, _ = BlogStats.objects.get_or_create(blog=blog)

    
    if stats.liked_users.filter(id=request.user.id).exists():
        return Response({'detail': "You have already liked this blog."}, status=400)

    stats.likes += 1
    stats.liked_users.add(request.user)  
    stats.save()

    return Response({'likes': stats.likes, 'liked': True}, status=200)


# ! Shares
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def blog_share(request, blog_id):
    blog = get_object_or_404(Blog, id=blog_id, deleted_at__isnull=True)

    stats, _ = BlogStats.objects.get_or_create(blog=blog)
    stats.shares += 1
    stats.save()
    return Response({'shares': stats.shares}, status=200)


# ! Get stats of a blog

RANGE_CHOICES = {
    "daily": TruncDay,
    "weekly": TruncWeek,
    "monthly": TruncMonth,
    "quarterly": TruncQuarter,
    "yearly": TruncYear,
}

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    range_type = request.GET.get("range", "monthly")
    truncate_func = RANGE_CHOICES.get(range_type, TruncMonth)


    total_views = BlogStats.objects.aggregate(total=Coalesce(Sum('views'), 0))['total']
    total_likes = BlogStats.objects.aggregate(total=Coalesce(Sum('likes'), 0))['total']
    total_shares = BlogStats.objects.aggregate(total=Coalesce(Sum('shares'), 0))['total']

    total_users = User.objects.count()
    total_blogs = Blog.objects.count()

    
    users_qs = (
        User.objects.filter(date_joined__isnull=False)
        .annotate(period=truncate_func('date_joined'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )
    users_by_range = [
        {"period": u["period"].strftime("%Y-%m-%d"), "count": u["count"]}
        for u in users_qs if u["period"] is not None
    ]

    # Blogs by range
    blogs_qs = (
        Blog.objects.filter(publish_at__isnull=False)
        .annotate(period=truncate_func('publish_at'))
        .values('period')
        .annotate(count=Count('id'))
        .order_by('period')
    )
    blogs_by_range = [
        {"period": b["period"].strftime("%Y-%m-%d"), "count": b["count"]}
        for b in blogs_qs if b["period"] is not None
    ]

    # Category stats (use Coalesce in annotation)
    category_stats = Category.objects.annotate(
        total_likes=Coalesce(Sum('blogs__stats__likes'), 0),
        total_shares=Coalesce(Sum('blogs__stats__shares'), 0),
        total_views=Coalesce(Sum('blogs__stats__views'), 0),
    ).values('name', 'total_likes', 'total_shares', 'total_views')

    # Top 5 Blogs by views
    blog_stats_qs = Blog.objects.annotate(
    likes_sum=Coalesce(Sum('stats__likes'), 0),
    shares_sum=Coalesce(Sum('stats__shares'), 0),
    views_sum=Coalesce(Sum('stats__views'), 0),
).order_by('-views_sum')[:5].values('title', 'likes_sum', 'shares_sum', 'views_sum')

    data = {
        "total_users": total_users,
        "total_blogs": total_blogs,
        "total_views": total_views,
        "total_likes": total_likes,
        "total_shares": total_shares,
        "users_by_range": users_by_range,
        "blogs_by_range": blogs_by_range,
        "category_stats": list(category_stats),
        "blog_stats": list(blog_stats_qs),
    }

    return Response(data)


