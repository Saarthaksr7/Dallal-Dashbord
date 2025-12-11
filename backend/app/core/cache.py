"""
Redis caching utility for API responses and data caching.
Falls back to in-memory caching if Redis is not available.
"""
import json
import hashlib
from typing import Optional, Any, Callable
from functools import wraps
import logging

try:
    import redis
    from app.core.config import settings
    REDIS_AVAILABLE = settings.REDIS_ENABLED
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)

class CacheManager:
    """Unified cache manager that supports Redis or in-memory fallback"""
    
    def __init__(self):
        self.redis_client = None
        self._memory_cache = {}
        
        if REDIS_AVAILABLE and redis:
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("✅ Redis cache connected successfully")
            except Exception as e:
                logger.warning(f"⚠️ Redis unavailable, using in-memory cache: {e}")
                self.redis_client = None
        else:
            logger.info("Using in-memory cache (Redis disabled)")
    
    def _make_key(self, prefix: str, key: str) -> str:
        """Generate cache key with prefix"""
        return f"{prefix}:{key}"
    
    def get(self, key: str, prefix: str = "cache") -> Optional[Any]:
        """Get value from cache"""
        cache_key = self._make_key(prefix, key)
        
        if self.redis_client:
            try:
                value = self.redis_client.get(cache_key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.error(f"Redis get error: {e}")
        
        # Fallback to memory cache
        return self._memory_cache.get(cache_key)
    
    def set(self, key: str, value: Any, ttl: int = 300, prefix: str = "cache") -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default: 5 minutes)
            prefix: Key prefix for organization
        """
        cache_key = self._make_key(prefix, key)
        
        if self.redis_client:
            try:
                self.redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(value)
                )
                return True
            except Exception as e:
                logger.error(f"Redis set error: {e}")
        
        # Fallback to memory cache
        self._memory_cache[cache_key] = value
        return True
    
    def delete(self, key: str, prefix: str = "cache") -> bool:
        """Delete key from cache"""
        cache_key = self._make_key(prefix, key)
        
        if self.redis_client:
            try:
                self.redis_client.delete(cache_key)
            except Exception as e:
                logger.error(f"Redis delete error: {e}")
        
        # Also remove from memory cache
        self._memory_cache.pop(cache_key, None)
        return True
    
    def clear_prefix(self, prefix: str) -> int:
        """Clear all keys with given prefix"""
        count = 0
        
        if self.redis_client:
            try:
                pattern = f"{prefix}:*"
                keys = self.redis_client.keys(pattern)
                if keys:
                    count = self.redis_client.delete(*keys)
            except Exception as e:
                logger.error(f"Redis clear error: {e}")
        
        # Clear from memory cache
        keys_to_delete = [k for k in self._memory_cache.keys() if k.startswith(f"{prefix}:")]
        for key in keys_to_delete:
            del self._memory_cache[key]
            count += 1
        
        return count
    
    def clear_all(self) -> bool:
        """Clear entire cache"""
        if self.redis_client:
            try:
                self.redis_client.flushdb()
            except Exception as e:
                logger.error(f"Redis flush error: {e}")
        
        self._memory_cache.clear()
        return True

# Global cache instance
cache = CacheManager()

def cached(ttl: int = 300, prefix: str = "api", key_func: Optional[Callable] = None):
    """
    Decorator to cache function results
    
    Usage:
        @cached(ttl=600, prefix="services")
        def get_services():
            return expensive_operation()
    
        @cached(ttl=60, key_func=lambda user_id: f"user_{user_id}")
        def get_user_data(user_id: int):
            return fetch_user(user_id)
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Use function name and args as key
                key_parts = [func.__name__]
                if args:
                    key_parts.extend(str(arg) for arg in args)
                if kwargs:
                    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                
                key_string = ":".join(key_parts)
                cache_key = hashlib.md5(key_string.encode()).hexdigest()
            
            # Try to get from cache
            cached_value = cache.get(cache_key, prefix=prefix)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {prefix}:{cache_key}")
                return cached_value
            
            # Execute function
            logger.debug(f"Cache MISS: {prefix}:{cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(cache_key, result, ttl=ttl, prefix=prefix)
            
            return result
        
        # Add cache control methods
        wrapper.cache_clear = lambda: cache.clear_prefix(prefix)
        wrapper.cache_info = lambda: {"prefix": prefix, "ttl": ttl}
        
        return wrapper
    
    return decorator

# Convenience functions
def cache_service_list(ttl: int = 60):
    """Cache decorator for service listings"""
    return cached(ttl=ttl, prefix="services")

def cache_metrics(ttl: int = 30):
    """Cache decorator for metrics data"""
    return cached(ttl=ttl, prefix="metrics")

def cache_docker_info(ttl: int = 10):
    """Cache decorator for Docker info"""
    return cached(ttl=ttl, prefix="docker")

# Example usage:
"""
from app.core.cache import cache, cached, cache_service_list

# Direct usage
cache.set("my_key", {"data": "value"}, ttl=600)
data = cache.get("my_key")
cache.delete("my_key")

# Decorator usage
@cache_service_list(ttl=120)
def get_all_services():
    # Expensive database query
    return services

# Manual key function
@cached(ttl=60, prefix="user", key_func=lambda user_id: str(user_id))
def get_user_profile(user_id: int):
    return fetch_user_from_db(user_id)
"""
