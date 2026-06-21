"""
Isoko recommender — training (Azure-ready).

This is the SageMaker notebook's logic with the SageMaker Studio startup/shutdown
cells removed. It loads the product dataset, builds TF-IDF content vectors + a
cosine-similarity matrix, and serializes everything to model/model.pkl.

Data source:
  - Set DATA_PATH to a local .tsv, or an Azure ML datastore / Blob-mounted path.
  - For now this defaults to the Walmart 5k sample used in the original notebook.
    NOTE: retrain on your OWN user_events before trusting these recommendations.

Run:
  pip install -r requirements.txt
  python -m spacy download en_core_web_sm   # optional; falls back to blank("en")
  python train.py
"""
import os
import pickle

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_PATH = os.environ.get("DATA_PATH", "marketing_sample_for_walmart_com-walmart_com_product_review__20200701_20201231__5k_data.tsv")
OUT_DIR = os.environ.get("OUT_DIR", "model")


def _stop_words():
    try:
        from spacy.lang.en.stop_words import STOP_WORDS

        return STOP_WORDS
    except Exception:
        return set()


def _nlp():
    import spacy

    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        return spacy.blank("en")


def main() -> None:
    df = pd.read_csv(DATA_PATH, sep="\t")

    keep = [
        "Uniq Id", "Product Id", "Product Rating", "Product Reviews Count",
        "Product Category", "Product Brand", "Product Name", "Product Image Url",
        "Product Description", "Product Tags",
    ]
    df = df[keep].rename(
        columns={
            "Uniq Id": "ID", "Product Id": "ProdID", "Product Rating": "Rating",
            "Product Reviews Count": "ReviewCount", "Product Category": "Category",
            "Product Brand": "Brand", "Product Name": "Name",
            "Product Image Url": "ImageURL", "Product Description": "Description",
            "Product Tags": "Tags",
        }
    )

    for col in ["Rating", "ReviewCount"]:
        df[col] = df[col].fillna(0)
    for col in ["Category", "Brand", "Description"]:
        df[col] = df[col].fillna("")

    nlp, stop = _nlp(), _stop_words()

    def clean_tags(text: str) -> str:
        doc = nlp(str(text).lower())
        return ", ".join(tok.text for tok in doc if tok.text.isalnum() and tok.text not in stop)

    for col in ["Category", "Brand", "Description"]:
        df[col] = df[col].apply(clean_tags)
    df["Tags"] = df[["Category", "Brand", "Description"]].agg(", ".join, axis=1)

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf = vectorizer.fit_transform(df["Tags"])
    cosine_sim = cosine_similarity(tfidf, tfidf)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, "model.pkl")
    with open(out_path, "wb") as f:
        pickle.dump(
            {
                "tfidf_vectorizer": vectorizer,
                "cosine_sim": cosine_sim,
                "train_data": df[["Name", "ReviewCount", "Brand", "ImageURL", "Rating"]].reset_index(drop=True),
            },
            f,
        )
    print(f"Saved {out_path}  ({len(df)} products)")


if __name__ == "__main__":
    main()
