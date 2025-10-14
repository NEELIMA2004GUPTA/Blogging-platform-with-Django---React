from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Blog, Comment, BlogStats

# Custom User admin
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'username', 'email', 'is_admin', 'is_staff', 'is_superuser')
    list_filter = ('is_admin', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    ordering = ('id',)
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password', 'profile_picture')}),
        ('Permissions', {'fields': ('is_admin', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'profile_picture'),
        }),
    )

admin.site.register(User, UserAdmin)
admin.site.register(Category)
admin.site.register(Blog)
admin.site.register(Comment)
admin.site.register(BlogStats)
