"""
Isoko recommender — FastAPI service (Azure Container Apps / Render / local).

Serves content-based recommendations for the Isoko catalog. The model is keyed
by product *id* (see train_isoko.py), so this returns Isoko product IDs that the
Next.js storefront hydrates directly.

Request : { "product_id": "p6", "top_n": 10 }   (item_name also accepted)
Response: { "recommendations": [ { "product_id": "p8", "score": 0.42, "reason": "content" }, ... ] }

The model.pkl is baked into the image (see Dockerfile) at /app/model/model.pkl.
"""
import os
import pickle

from fastapi import FastAPI
from pydantic import BaseModel

MODEL_PATH = os.environ.get("MODEL_PATH", "model/model.pkl")

app = FastAPI(title="Isoko Recommender")
_model = None


def get_model():
    global _model
    if _model is None:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
    return _model


class RecRequest(BaseModel):
    product_id: str | None = None
    item_name: str | None = None
    top_n: int = 10


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommend")
def recommend(req: RecRequest):
    model = get_model()
    ids = model["ids"]
    cats = model.get("cats", [])
    titles = model.get("titles", [])
    cosine_sim = model["cosine_sim"]

    # Resolve the seed product index by id (preferred) or by title.
    idx = None
    if req.product_id and req.product_id in ids:
        idx = ids.index(req.product_id)
    elif req.item_name and req.item_name in titles:
        idx = titles.index(req.item_name)
    if idx is None:
        return {"recommendations": []}  # unknown -> let the caller fall back

    seed_cat = cats[idx] if cats else None
    scores = sorted(enumerate(cosine_sim[idx]), key=lambda x: x[1], reverse=True)
    out = []
    for i, score in scores:
        if i == idx:
            continue  # skip the seed product itself
        reason = "content" if (seed_cat and cats and cats[i] == seed_cat) else "popularity"
        out.append({"product_id": ids[i], "score": round(float(score), 3), "reason": reason})
        if len(out) >= req.top_n:
            break
    return {"recommendations": out}
