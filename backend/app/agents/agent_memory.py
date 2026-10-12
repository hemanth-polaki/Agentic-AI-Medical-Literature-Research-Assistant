import json
from typing import Dict, Any, Optional, List
import os

try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None

from app.config import settings

class AgentMemory:
    """
    Agent Memory Component backed by Redis with local fallback.
    Maintains short-term agent scratchpad, step history, and cross-agent context.
    """
    def __init__(self):
        self.redis_url = settings.REDIS_URL or "redis://localhost:6379/0"
        self._redis_client: Optional[Any] = None
        self._in_memory_store: Dict[str, Dict[str, Any]] = {}
        self._connected: bool = False

    async def get_client(self) -> Optional[Any]:
        if aioredis is None:
            return None
        if self._redis_client is None:
            try:
                self._redis_client = aioredis.from_url(
                    self.redis_url, 
                    decode_responses=True,
                    socket_connect_timeout=1.0
                )
                await self._redis_client.ping()
                self._connected = True
                print("[AgentMemory] Connected to Redis for Agent Memory.")
            except Exception as e:
                # Fallback to local memory if Redis server is not reachable
                self._redis_client = None
                self._connected = False
        return self._redis_client

    async def save_context(self, session_id: str, key: str, value: Any, ttl: int = 86400) -> None:
        """Saves intermediate agent state into memory"""
        client = await self.get_client()
        serialized = json.dumps(value, default=str)
        
        if client and self._connected:
            try:
                redis_key = f"agent_memory:{session_id}:{key}"
                await client.setex(redis_key, ttl, serialized)
                return
            except Exception:
                self._connected = False

        # In-memory fallback
        if session_id not in self._in_memory_store:
            self._in_memory_store[session_id] = {}
        self._in_memory_store[session_id][key] = value

    async def get_context(self, session_id: str, key: str) -> Optional[Any]:
        """Retrieves stored agent state from memory"""
        client = await self.get_client()
        
        if client and self._connected:
            try:
                redis_key = f"agent_memory:{session_id}:{key}"
                val = await client.get(redis_key)
                if val:
                    return json.loads(val)
            except Exception:
                self._connected = False

        # In-memory fallback
        return self._in_memory_store.get(session_id, {}).get(key)

    async def record_agent_step(self, session_id: str, agent_name: str, action: str, details: str) -> None:
        """Maintains chronologically ordered agent working memory"""
        client = await self.get_client()
        step = {
            "agent": agent_name,
            "action": action,
            "details": details
        }
        
        if client and self._connected:
            try:
                list_key = f"agent_trace:{session_id}"
                await client.rpush(list_key, json.dumps(step))
                return
            except Exception:
                self._connected = False

        if session_id not in self._in_memory_store:
            self._in_memory_store[session_id] = {}
        history = self._in_memory_store[session_id].get("trace_history", [])
        history.append(step)
        self._in_memory_store[session_id]["trace_history"] = history

    async def get_agent_steps(self, session_id: str) -> List[Dict[str, Any]]:
        client = await self.get_client()
        if client and self._connected:
            try:
                list_key = f"agent_trace:{session_id}"
                items = await client.lrange(list_key, 0, -1)
                return [json.loads(i) for i in items]
            except Exception:
                self._connected = False

        return self._in_memory_store.get(session_id, {}).get("trace_history", [])

agent_memory = AgentMemory()
