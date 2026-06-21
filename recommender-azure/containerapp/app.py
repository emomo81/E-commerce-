"""
Isoko recommender — FastAPI service for Azure Container Apps (scale-to-zero).

Same model + logic as the Azure ML scoring script, but packaged as a plain HTTP
service so it can run on Azure Container Apps (pay-per-request, scales to zero)
instead of an always-on Managed Online Endpoint.

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
    item_name: str
    top_n: int = 8


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommend")
def recommend(req: RecRequest):
    model = get_model()
    df = model["train_data"]
    cosine_sim = model["cosine_sim"]

    if req.item_name not in df["Name"].values:
        return {"error": f"Item not found: {req.item_name}", "recommendations": []}

    idx = df[df["Name"] == req.item_name].index[0]
    scores = sorted(enumerate(cosine_sim[idx]), key=lambda x: x[1], reverse=True)
    top = scores[1 : req.top_n + 1]
    rows = df.iloc[[i for i, _ in top]][["Name", "Brand", "Rating", "ImageURL", "ReviewCount"]]
    return {"recommendations": rows.to_dict(orient="records")}
