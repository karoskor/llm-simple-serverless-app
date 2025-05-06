from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class Resource:
    name: str
    url: Optional[str] = None
    type: Optional[str] = None

@dataclass
class Activity:
    description: str
    estimated_duration: Optional[int] = None

@dataclass
class Milestone:
    description: str
    completion_criteria: Optional[str] = None

@dataclass
class Week:
    number: int
    focus: str
    resources: List[Resource]
    activities: List[Activity]
    milestones: List[Milestone]

@dataclass
class LearningPlan:
    topic: str
    overview: str
    weeks: List[Week]
    created_at: datetime = datetime.now()

@dataclass
class UserPreferences:
    topic: str
    knowledge_level: str
    time_available: int
    learning_preferences: str