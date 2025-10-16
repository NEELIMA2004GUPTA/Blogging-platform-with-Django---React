from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Blog, Comment, BlogStats

# Custom User admin
class UserAdmin(BaseUserAdmin):
    
    search_fields = ('username', 'email')
    ordering = ('id',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('profile_picture','is_admin')}),
    )

admin.site.register(User, UserAdmin)
admin.site.register(Category)
admin.site.register(Blog)
admin.site.register(Comment)
admin.site.register(BlogStats)
