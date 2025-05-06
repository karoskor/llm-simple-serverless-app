class BedrockError(Exception):
    """Base exception for Bedrock related errors"""
    pass

class ModelInvocationError(BedrockError):
    """Raised when there's an error invoking the model"""
    pass

class InvalidResponseError(BedrockError):
    """Raised when the model response is invalid"""
    pass