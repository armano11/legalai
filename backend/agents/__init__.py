"""Agent orchestration system for LegalAI agentic workflows."""

from backend.agents.parallel_synthesis_agent import parallel_synthesis_agent
from backend.agents.smart_router_agent import smart_router_agent

__all__ = [
    "parallel_synthesis_agent",
    "smart_router_agent",
]
