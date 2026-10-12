import asyncio
import json
from app.models.database import init_db
from app.agents.orchestrator import orchestrator
from app.models.schemas import SearchRequest

async def main():
    await init_db()
    req = SearchRequest(
        query="Review recent research on deep-learning methods for EEG seizure detection and compare datasets, models, validation methods, and evaluation metrics.",
        max_results=6
    )
    print("Starting review stream...", flush=True)
    count = 0
    async for chunk in orchestrator.stream_review(req):
        data = json.loads(chunk)
        count += 1
        print(f"Step {count}: Type={data.get('type')} Status={data.get('status')}", flush=True)
        if data.get("type") == "completed":
            print("Successfully completed!", flush=True)
            print("Evidence table count:", len(data["data"]["evidence_table"]), flush=True)
            print("Claims count:", len(data["data"]["grounded_claims"]), flush=True)
            print("Synthesis preview:\n", data["data"]["final_synthesis"][:200], flush=True)

if __name__ == "__main__":
    asyncio.run(main())
