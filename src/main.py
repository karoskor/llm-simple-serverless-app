import logging
from typing import Dict, Any

from bedrock.services import LearningPlanService
from bedrock.models import UserPreferences
from bedrock.exceptions import BedrockError
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_learning_plan(user_input: Dict[str, Any]) -> Dict[str, Any]:
    try:
        preferences = UserPreferences(
            topic=user_input['topic'],
            knowledge_level=user_input['knowledge_level'],
            time_available=user_input['time_available'],
            learning_preferences=user_input['learning_preferences']
        )

        service = LearningPlanService()
        learning_plan = service.generate_plan(preferences)

        return {
            "topic": learning_plan.topic,
            "overview": learning_plan.overview,
            "weeks": [
                {
                    "week": week.number,
                    "focus": week.focus,
                    "resources": [vars(r) for r in week.resources],
                    "activities": [vars(a) for a in week.activities],
                    "milestones": [vars(m) for m in week.milestones]
                }
                for week in learning_plan.weeks
            ]
        }


    except BedrockError as e:
        logger.error(f"Error generating learning plan: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise



def test_bedrock_connection():
    test_preferences = UserPreferences(
        topic="Python Programming",
        knowledge_level="beginner",
        time_available=10,
        learning_preferences="video tutorials, hands-on projects"
    )

    service = LearningPlanService()

    try:
        plan = service.generate_plan(test_preferences)
        print("success, plan was generated:")
        print(f"Topic: {plan.topic}")
        print(f"Overview: {plan.overview}")
        for week in plan.weeks:
            print(f"\nWeek {week.number}:")
            print(f"Focus: {week.focus}")
    except Exception as e:
        print(f"error while generating: {str(e)}")

if __name__ == "__main__":
    test_bedrock_connection()