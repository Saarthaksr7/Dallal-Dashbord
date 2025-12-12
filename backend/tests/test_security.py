"""
Unit tests for security utilities
"""
import pytest
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    validate_password_strength,
    generate_api_key
)


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password(self):
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
    
    def test_verify_correct_password(self):
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password("WrongPassword", hashed) is False


class TestPasswordStrength:
    """Test password strength validation"""
    
    def test_strong_password(self):
        result = validate_password_strength("StrongPass123!")
        assert result['is_valid'] is True
    
    def test_weak_password_too_short(self):
        result = validate_password_strength("Short1!")
        assert result['is_valid'] is False
        assert 'too short' in result['message'].lower()
    
    def test_weak_password_no_uppercase(self):
        result = validate_password_strength("lowercase123!")
        assert result['is_valid'] is False
    
    def test_weak_password_no_number(self):
        result = validate_password_strength("NoNumbers!")
        assert result['is_valid'] is False
    
    def test_weak_password_no_special(self):
        result = validate_password_strength("NoSpecial123")
        assert result['is_valid'] is False


class TestTokenGeneration:
    """Test JWT token generation"""
    
    def test_create_access_token(self):
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_generate_api_key(self):
        api_key = generate_api_key()
        
        assert api_key is not None
        assert len(api_key) == 32
        assert api_key.isalnum()
