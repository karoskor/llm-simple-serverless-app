import boto3
import json
from typing import Optional
from .exceptions import BedrockError, ModelInvocationError, InvalidResponseError
from .models import UserPreferences, LearningPlan, Resource, Activity, Milestone, Week
from .config import BedrockConfig
from .utils import retry_with_exponential_backoff


class BedrockClient:
    """Handles communication with AWS Bedrock service"""

    def __init__(self, region_name: Optional[str] = None):
        self.region_name = region_name or BedrockConfig.DEFAULT_REGION
        self.client = self._initialize_client()

    def _initialize_client(self):
        try:
            return boto3.client(
                service_name='bedrock-runtime',
                region_name=self.region_name
            )
        except Exception as e:
            raise BedrockError(f"Failed to initialize Bedrock client: {str(e)}")

    @retry_with_exponential_backoff(max_retries=BedrockConfig.MAX_RETRIES)
    def invoke_model_stream(self, prompt: str, model_id: Optional[str] = None):
        try:
            response = self.client.invoke_model_with_response_stream(
                modelId=model_id or BedrockConfig.DEFAULT_MODEL_ID,
                body=json.dumps({
                    "prompt": f"\n\nHuman: {prompt}\n\nAssistant:",
                    **BedrockConfig.get_model_parameters()
                })
            )

            for event in response.get('body'):
                chunk = json.loads(event['chunk']['bytes'].decode())
                yield chunk.get('completion', '')

        except Exception as e:
            raise ModelInvocationError(f"Error invoking Bedrock model stream: {str(e)}")

class PromptGenerator:
    """Generates prompts for different use cases"""

    @staticmethod
    def create_learning_plan_prompt(preferences: UserPreferences) -> str:
        return f"""
        Generate a personalized learning plan for {preferences.topic}.
        The user's knowledge level is: {preferences.knowledge_level}
        They have {preferences.time_available} hours available weekly.
        Their preferences are: {preferences.learning_preferences}

        Return ONLY a JSON object with the following structure:
        {{
            "topic": "Main topic",
            "overview": "Brief overview",
            "weeks": [
                {{
                    "week": 1,
                    "focus": "Focus area",
                    "resources": ["Resource 1", "Resource 2"],
                    "activities": ["Activity 1", "Activity 2"],
                    "milestones": ["Milestone 1"]
                }}
            ]
        }}
        """


class ResponseValidator:
    """Validates and processes model responses"""

    @staticmethod
    def validate_learning_plan(response: str) -> bool:
        try:
            plan = json.loads(response)
            required_fields = ['topic', 'overview', 'weeks']
            if not all(field in plan for field in required_fields):
                return False
            return True
        except json.JSONDecodeError:
            return False


class LearningPlanService:
    """Main service for generating learning plans"""

    def __init__(self, bedrock_client: Optional[BedrockClient] = None):
        self.bedrock_client = bedrock_client or BedrockClient()
        self.prompt_generator = PromptGenerator()
        self.validator = ResponseValidator()

    def generate_plan(self, preferences: UserPreferences) -> LearningPlan:
        prompt = self.prompt_generator.create_learning_plan_prompt(preferences)

        full_response = ""
        for chunk in self.bedrock_client.invoke_model_stream(prompt):
            full_response += chunk

        if not self.validator.validate_learning_plan(full_response):
            raise InvalidResponseError("Invalid response format from Bedrock")

        return self._convert_to_learning_plan(full_response)

    def _convert_to_learning_plan(self, response: str) -> LearningPlan:
        try:
            data = json.loads(response)

            weeks = []
            for week_data in data['weeks']:
                resources = [Resource(name=r) if isinstance(r, str) else Resource(**r)
                             for r in week_data['resources']]

                activities = [Activity(description=a) if isinstance(a, str) else Activity(**a)
                              for a in week_data['activities']]

                milestones = [Milestone(description=m) if isinstance(m, str) else Milestone(**m)
                              for m in week_data['milestones']]

                week = Week(
                    number=week_data['week'],
                    focus=week_data['focus'],
                    resources=resources,
                    activities=activities,
                    milestones=milestones
                )
                weeks.append(week)

            return LearningPlan(
                topic=data['topic'],
                overview=data['overview'],
                weeks=weeks
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise InvalidResponseError(f"Error converting response to LearningPlan: {str(e)}")