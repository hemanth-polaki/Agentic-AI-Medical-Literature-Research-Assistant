import requests
import json
import sys

url = "http://localhost:8000/api/review/stream"
payload = {
    "query": "A modified Gray Wolf Optimization algorithm for early detection of Parkinson's Disease",
    "max_results": 6,
    "use_llm": True
}

print("Starting stream request to FastAPI backend...")
try:
    with requests.post(url, json=payload, stream=True, timeout=180) as r:
        print("Response status code:", r.status_code)
        for line in r.iter_lines():
            if line:
                line_str = line.decode("utf-8")
                if line_str.startswith("data: "):
                    data = json.loads(line_str[6:])
                    mtype = data.get("type")
                    status = data.get("status")
                    review_data = data.get("data", {})
                    retrieved_count = len(review_data.get("retrieved_papers", []))
                    evidence_count = len(review_data.get("evidence_table", []))
                    has_comp = review_data.get("comparison") is not None
                    synth_len = len(review_data.get("final_synthesis", ""))
                    print(f"[{mtype}] status={status} | papers={retrieved_count} | evidence={evidence_count} | comparison={has_comp} | synthesis_chars={synth_len}")
except Exception as e:
    print(f"Error: {e}")
