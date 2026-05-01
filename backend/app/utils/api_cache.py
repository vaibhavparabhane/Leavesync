"""
API Response Caching
Intelligent caching for API responses
"""

import json
import hashlib
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta

# Simple in-memory cache (for development)
class SimpleAPICache:
    def __init__(self):
        self.cache = {}
    
    def generate_cache_key(self, endpoint, params=None, user_id=None):
        """Generate cache key for endpoint"""
        key_parts = [endpoint]
        
        if user_id:
            key_parts.append(f"user:{user_id}")
        
        if params:
            sorted_params = sorted(params.items()) if isinstance(params, dict) else params
            params_str = json.dumps(sorted_params, sort_keys=True)
            key_parts.append(hashlib.md5(params_str.encode()).hexdigest())
        
        return ":".join(key_parts)
    
    def get(self, key):
        """Get cached response"""
        if key in self.cache:
            cached_data = self.cache[key]
            # Check if expired
            if datetime.utcnow() < cached_data["expires_at"]:
                return cached_data["data"]
            else:
                del self.cache[key]
        return None
    
    def set(self, key, data, ttl_seconds=300):
        """Cache response"""
        cache_data = {
            "data": {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl_seconds
            },
            "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds)
        }
        self.cache[key] = cache_data
    
    def delete(self, pattern):
        """Delete cached responses by pattern"""
        keys_to_delete = [k for k in self.cache.keys() if pattern.replace("*", "") in k]
        for key in keys_to_delete:
            del self.cache[key]
    
    def clear_user_cache(self, user_id):
        """Clear all cache for a specific user"""
        self.delete(f"user:{user_id}")

# Global cache instance
api_cache = SimpleAPICache()

def cache_response(ttl_seconds=300, user_specific=False, cache_key_func=None):
    """Decorator for caching API responses"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Skip caching for non-GET requests
            if request.method != 'GET':
                return f(*args, **kwargs)
            
            # Generate cache key
            if cache_key_func:
                cache_key = cache_key_func(request, *args, **kwargs)
            else:
                user_id = None
                if user_specific:
                    from flask_jwt_extended import get_jwt_identity
                    try:
                        user_id = get_jwt_identity()
                    except:
                        pass
                
                cache_key = api_cache.generate_cache_key(
                    endpoint=request.endpoint,
                    params=dict(request.args),
                    user_id=user_id
                )
            
            # Try to get from cache
            cached_response = api_cache.get(cache_key)
            if cached_response:
                response_data = cached_response["data"]
                # Add cache headers
                response = jsonify(response_data)
                response.headers['X-Cache'] = 'HIT'
                response.headers['X-Cache-Key'] = cache_key
                return response
            
            # Execute function and cache result
            result = f(*args, **kwargs)
            
            # Cache successful responses
            if hasattr(result, 'status_code') and result.status_code == 200:
                try:
                    response_data = result.get_json()
                    api_cache.set(cache_key, response_data, ttl_seconds)
                    result.headers['X-Cache'] = 'MISS'
                    result.headers['X-Cache-Key'] = cache_key
                except:
                    pass
            
            return result
        
        return decorated_function
    return decorator

def invalidate_cache_on_change(cache_patterns):
    """Decorator to invalidate cache when data changes"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            
            # Invalidate cache on successful operations
            if hasattr(result, 'status_code') and result.status_code in [200, 201]:
                for pattern in cache_patterns:
                    api_cache.delete(pattern)
            
            return result
        
        return decorated_function
    return decorator