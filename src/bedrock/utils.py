import time
from functools import wraps
from typing import Callable, Any
from .config import BedrockConfig

def retry_with_exponential_backoff(max_retries: int = 3) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            for i in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if i == max_retries - 1:
                        raise
                    time.sleep(BedrockConfig.RETRY_DELAY ** i)
            return None
        return wrapper
    return decorator