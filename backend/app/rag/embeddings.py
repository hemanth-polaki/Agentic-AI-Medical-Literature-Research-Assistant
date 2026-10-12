import numpy as np
from typing import List, Optional

class EmbeddingModel:
    def __init__(self):
        self._st_model = None
        self._tried_loading = False

    def _load_model(self):
        if not self._tried_loading:
            self._tried_loading = True
            try:
                from sentence_transformers import SentenceTransformer
                # Use lightweight fast model
                self._st_model = SentenceTransformer('all-MiniLM-L6-v2')
                print("[EmbeddingModel] Loaded all-MiniLM-L6-v2 sentence transformer")
            except Exception as e:
                print(f"[EmbeddingModel] SentenceTransformer load failed or skipped: {e}")
                self._st_model = None

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        self._load_model()
        if self._st_model is not None:
            try:
                embeddings = self._st_model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
                # Normalize for cosine similarity in FAISS IndexFlatIP
                norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                norms[norms == 0] = 1e-10
                return embeddings / norms
            except Exception as e:
                print(f"[EmbeddingModel] ST encode error: {e}")

        # High-performance deterministic fallback embedding (384-dimensional)
        return self._fallback_embed(texts)

    def embed_query(self, text: str) -> np.ndarray:
        return self.embed_documents([text])[0]

    def _fallback_embed(self, texts: List[str]) -> np.ndarray:
        dim = 384
        res = []
        for text in texts:
            vec = np.zeros(dim, dtype=np.float32)
            words = text.lower().split()
            if not words:
                res.append(vec)
                continue
            for i, word in enumerate(words):
                h = abs(hash(word))
                idx = h % dim
                sign = 1.0 if ((h >> 4) % 2 == 0) else -1.0
                vec[idx] += sign * (1.0 / (1.0 + (i * 0.05)))
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            res.append(vec)
        return np.array(res, dtype=np.float32)

embedding_model = EmbeddingModel()
