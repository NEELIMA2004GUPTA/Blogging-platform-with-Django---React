from rest_framework import serializers
from .models import User,Category,Blog,Comment,BlogStats
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model, password_validation
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError

# ! Validation for images(profile picture, blog image)
def validate_image(file):
    # Allowed file types
    valid_mime_types = ['image/jpeg', 'image/png', 'image/gif']
    if file.content_type not in valid_mime_types:
        raise ValidationError('Unsupported file type. Only JPG, PNG, GIF allowed.')

    # Max file size
    max_size = 5 * 1024 * 1024 
    if file.size > max_size:
        raise ValidationError('File too large. Maximum size allowed is 5MB.')
    
# ! User serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_picture', 'is_admin']
        read_only_fields = ['is_admin'] 

# ! Register Serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True) 

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'profile_picture']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            profile_picture=validated_data.get('profile_picture', None)
        )
        return user

# ! JWT Token serializer
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['is_admin'] = user.is_admin
        return token
    
# ! Forgot Password 
class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

# ! Reset Password
class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, required=True, validators=[password_validation.validate_password])

# ! Category serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

# ! Comment serializer
class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)  

    class Meta:
        model = Comment
        fields = ['id', 'blog', 'author', 'content', 'created_at']
        read_only_fields = ['author', 'created_at']

# ! Blog-stats serializer
class BlogStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogStats
        fields = ['views', 'likes', 'shares']

# ! Blog serializer

class BlogSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    # For output
    category = CategorySerializer(read_only=True)
    # For input
    category_name = serializers.CharField(write_only=True)

    comments = CommentSerializer(many=True, read_only=True)
    stats = BlogStatsSerializer(read_only=True)

    class Meta:
        model = Blog
        fields = [
            'id', 'title', 'content', 'author', 'category', 'category_name', 'image',
            'created_at', 'updated_at', 'is_published', 'publish_at',
            'deleted_at', 'comments', 'stats'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at', 'deleted_at', 'comments', 'stats']

    def create(self, validated_data):
        category_name = validated_data.pop('category_name')
        category, _ = Category.objects.get_or_create(name=category_name)
        blog = Blog.objects.create(category=category, **validated_data)
        return blog

    def update(self, instance, validated_data):
        category_name = validated_data.pop('category_name', None)
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
            instance.category = category

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance