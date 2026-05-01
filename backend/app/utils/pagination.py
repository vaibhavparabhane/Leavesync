"""Pagination utility for consistent pagination across controllers"""

def create_pagination_response(page: int, per_page: int, total_count: int) -> dict:
    """
    Create standardized pagination response
    
    Args:
        page: Current page number
        per_page: Items per page
        total_count: Total number of items
        
    Returns:
        Dictionary with pagination metadata
    """
    return {
        "page": page,
        "per_page": per_page,
        "total_count": total_count,
        "total_pages": (total_count + per_page - 1) // per_page if total_count > 0 else 0
    }
