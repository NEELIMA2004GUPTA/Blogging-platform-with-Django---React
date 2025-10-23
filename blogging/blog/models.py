from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


# ! Custom user model 
class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_admin = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        return self.username

# ! Category model
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# ! Blog model
class Blog(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blogs')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='blogs')
    image = models.ImageField(upload_to='blog_images/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)
    publish_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    likes = models.PositiveIntegerField(default=0)
    liked_users = models.ManyToManyField(User, related_name='liked_blogs_main', blank=True)
    

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save()
    
    def save(self, *args, **kwargs):
        if self.publish_at and self.publish_at <= timezone.now():
            self.is_published = True
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.title
    
# ! Comment model
class Comment(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.author.username} on {self.blog.title}"
    
# ! Blog Stats
class BlogStats(models.Model):
    blog = models.OneToOneField(Blog, on_delete=models.CASCADE, related_name='stats')
    views = models.PositiveIntegerField(default=0)
    liked_users = models.ManyToManyField(User, related_name="liked_blogs", blank=True)
    shares = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"Stats for {self.blog.title}"

@receiver(post_save, sender=Blog)
def create_blog_stats(sender, instance, created, **kwargs):
    if created and not hasattr(instance, 'stats'):
        stats = BlogStats.objects.get_or_create(blog=instance)
        