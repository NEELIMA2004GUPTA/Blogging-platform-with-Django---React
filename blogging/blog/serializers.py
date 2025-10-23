from rest_framework import serializers
from .models import User,Category,Blog,Comment,BlogStats
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model, password_validation
from rest_framework.serializers import ValidationError
from django.conf import settings



User=get_user_model()

# ! Validation for images(profile picture, blog image)
def validate_image(image):
    valid_extensions = ['jpg', 'jpeg', 'png', 'gif']
    ext = image.name.split('.')[-1].lower()
    if ext not in valid_extensions:
        raise ValidationError('Unsupported file type. Only JPG, PNG, GIF allowed.')
    if image.size > 5 * 1024 * 1024:  # 5 MB
        raise ValidationError('File too large. Maximum size allowed is 5MB.')
    return image
    
# ! User serializer
class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_picture', 'is_staff','is_admin']
        read_only_fields = ['is_staff','is_admin'] 
    
    def get_is_admin(self, obj):
        return obj.is_admin
    
    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return f"{settings.NGROK_URL}{obj.profile_picture.url}"
        return "https://via.placeholder.com/30"
    

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

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value

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

# ! Blog Serializer

class BlogSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(write_only=True)
    stats = BlogStatsSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    image_url= serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Blog
        fields = ['id', 'title', 'content', 'author', 'category', 'category_name','image_url','image','liked','likes',"is_published","publish_at","created_at","deleted_at","updated_at","stats","comments"]
        read_only_fields = ['author', 'category',"created_at","deleted_at","updated_at"]

    def validate_category_name(self, value):
        try:
            category = Category.objects.get(name=value)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Category does not exist. Only admins can create new categories.")
        return value

    def create(self, validated_data):
        category_name = validated_data.pop('category_name')
        category = Category.objects.get(name=category_name)
        blog = Blog.objects.create(category=category, **validated_data)
        return blog

    def update(self, instance, validated_data):
        category_name = validated_data.pop('category_name', None)
        if category_name:
            category = Category.objects.get(name=category_name)
            instance.category = category

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def get_image_url(self, obj):
        if obj.image:
            return f"{settings.NGROK_URL}{obj.image.url}"
        return "https://via.placeholder.com/150"
    
    def get_likes(self, obj):
        if hasattr(obj, 'stats'):
            return obj.stats.likes
        return 0

    def get_liked(self, obj):
        user = self.context['request'].user
        if not hasattr(obj, 'stats'):
            return False
        if user.is_authenticated:
            return obj.stats.liked_users.filter(id=user.id).exists()
        return False