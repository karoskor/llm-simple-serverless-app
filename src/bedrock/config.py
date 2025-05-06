from typing import Dict, Any

class BedrockConfig:
    DEFAULT_MODEL_ID = 'anthropic.claude-v2'
    DEFAULT_REGION = 'us-west-2'
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds

    @staticmethod
    def get_model_parameters() -> Dict[str, Any]:
        return {
            "max_tokens_to_sample": 4000,
            "temperature": 0.5,
            "top_p": 0.9,
        }