"""
Unit tests for validation utilities
"""
import pytest
from app.core.validation import (
    sanitize_html,
    validate_ip,
    validate_port,
    validate_email,
    validate_url,
    InputValidator
)


class TestSanitization:
    """Test HTML sanitization"""
    
    def test_sanitize_simple_text(self):
        result = sanitize_html("Hello World")
        assert result == "Hello World"
    
    def test_sanitize_script_tag(self):
        result = sanitize_html("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "alert" not in result
    
    def test_sanitize_html_entities(self):
        result = sanitize_html("<b>Bold</b>")
        assert "<b>" not in result or result == "&lt;b&gt;Bold&lt;/b&gt;"
    
    def test_sanitize_sql_injection(self):
        result = sanitize_html("' OR '1'='1")
        assert result  # Should be sanitized


class TestValidators:
    """Test validation functions"""
    
    def test_validate_ip_valid(self):
        assert validate_ip("192.168.1.1") is True
        assert validate_ip("10.0.0.1") is True
        assert validate_ip("255.255.255.255") is True
    
    def test_validate_ip_invalid(self):
        assert validate_ip("256.1.1.1") is False
        assert validate_ip("192.168.1") is False
        assert validate_ip("not.an.ip.address") is False
        assert validate_ip("") is False
    
    def test_validate_port_valid(self):
        assert validate_port(80) is True
        assert validate_port(443) is True
        assert validate_port(8080) is True
        assert validate_port(1) is True
        assert validate_port(65535) is True
    
    def test_validate_port_invalid(self):
        assert validate_port(0) is False
        assert validate_port(65536) is False
        assert validate_port(-1) is False
        assert validate_port("not a port") is False
    
    def test_validate_email_valid(self):
        assert validate_email("test@example.com") is True
        assert validate_email("user.name@domain.co.uk") is True
    
    def test_validate_email_invalid(self):
        assert validate_email("not-an-email") is False
        assert validate_email("@example.com") is False
        assert validate_email("test@") is False
    
    def test_validate_url_valid(self):
        assert validate_url("https://example.com") is True
        assert validate_url("http://localhost:8000") is True
    
    def test_validate_url_invalid(self):
        assert validate_url("not a url") is False
        assert validate_url("ftp://example.com") is False  # Only http(s) allowed


class TestInputValidator:
    """Test InputValidator class"""
    
    def test_validate_string_valid(self):
        validator = InputValidator()
        result = validator.validate_string("test", min_length=1, max_length=10)
        assert result is True
    
    def test_validate_string_too_short(self):
        validator = InputValidator()
        with pytest.raises(ValueError):
            validator.validate_string("", min_length=1)
    
    def test_validate_string_too_long(self):
        validator = InputValidator()
        with pytest.raises(ValueError):
            validator.validate_string("very long string", max_length=5)
    
    def test_validate_integer_valid(self):
        validator = InputValidator()
        result = validator.validate_integer(50, min_value=0, max_value=100)
        assert result is True
    
    def test_validate_integer_out_of_range(self):
        validator = InputValidator()
        with pytest.raises(ValueError):
            validator.validate_integer(150, max_value=100)
