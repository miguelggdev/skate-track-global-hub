from abc import ABC, abstractmethod
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
from config import settings


class BaseAgent(ABC):
    def __init__(self) -> None:
        self.llm = ChatAnthropic(
            model="claude-sonnet-4-6",
            api_key=settings.anthropic_api_key,
            max_tokens=4096,
        )

    @property
    @abstractmethod
    def agent_id(self) -> str: ...

    @property
    @abstractmethod
    def system_prompt(self) -> str: ...

    @abstractmethod
    async def chat(self, message: str, history: list[dict]) -> str: ...

    def _build_messages(self, message: str, history: list[dict]) -> list[BaseMessage]:
        """Para agentes que llaman al LLM directamente (incluye SystemMessage)."""
        messages: list[BaseMessage] = [SystemMessage(content=self.system_prompt)]
        for h in history:
            role = h.get("role", "")
            content = h.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
        messages.append(HumanMessage(content=message))
        return messages

    def _build_history(self, message: str, history: list[dict]) -> list[BaseMessage]:
        """Para create_react_agent: sin SystemMessage (ya está en state_modifier)."""
        lc_msgs: list[BaseMessage] = []
        for h in history:
            role = h.get("role", "")
            content = h.get("content", "")
            if role == "user":
                lc_msgs.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_msgs.append(AIMessage(content=content))
        lc_msgs.append(HumanMessage(content=message))
        return lc_msgs
