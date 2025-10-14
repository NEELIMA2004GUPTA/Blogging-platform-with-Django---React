from django.urls import path
from .views import register, logout, me, MyTokenObtainPairView, blogs_list_create, blog_detail, password_reset_request, password_reset_confirm, categories_list_create,category_detail,blog_comments,comment_detail, blog_like,blog_share,admin_stats
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('auth/register/', register, name='register'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout, name='logout'),
    path('auth/me/', me, name='current_user'),
     path('auth/reset-password/', password_reset_request, name='password_reset'),
    path('auth/reset-password-confirm/<uid>/<token>/', password_reset_confirm, name='password_reset_confirm'),

    path('blogs/', blogs_list_create, name='blogs-list-create'),
    path('blogs/<int:blog_id>/', blog_detail, name='blog-detail'),

    path('categories/', categories_list_create, name='categories-list-create'),
    path('categories/<int:category_id>/', category_detail, name='category-detail'),

    path('blogs/<int:blog_id>/comments/', blog_comments, name='blog-comments'),
    path('comments/<int:comment_id>/', comment_detail, name='comment-detail'),

    path('blogs/<int:blog_id>/like/', blog_like, name='blog-like'),
    path('blogs/<int:blog_id>/share/', blog_share, name='blog-share'),

    path('stats/', admin_stats, name='admin-stats'),
]