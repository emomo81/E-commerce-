"""
Azure ML Managed Online Endpoint scoring script.

Azure's contract is init() (load once) + run(raw_data) (per request) — the
equivalent of SageMaker's model_fn / predict_fn. Azure mounts the registered
model under the AZUREML_MODEL_DIR environment variable.
"""
import json
import os
import pickle

model = None


def init() -> None:
    global model
    model_dir = os.environ.get("AZUREML_MODEL_DIR", ".")
    # The registered asset preserves the model/ subfolder created by train.py.
    path = os.path.join(model_dir, "model", "model.pkl")
    if not os.path.exists(path):  # tolerate flattened registration
        path = os.path.join(model_dir, "model.pkl")
    with open(path, "rb") as f:
        model = pickle.load(f)


def run(raw_data: str):
    data = json.loads(raw_data)
    item_name = data.get("item_name")
    top_n = int(data.get("top_n", 8))

    df = model["train_data"]
    cosine_sim = model["cosine_sim"]

    if item_name is None or item_name not in df["Name"].values:
        return {"error": f"Item not found: {item_name}"}

    idx = df[df["Name"] == item_name].index[0]
    scores = sorted(enumerate(cosine_sim[idx]), key=lambda x: x[1], reverse=True)
    top = scores[1 : top_n + 1]
    rows = df.iloc[[i for i, _ in top]][["Name", "Brand", "Rating", "ImageURL", "ReviewCount"]]
    return rows.to_dict(orient="records")
