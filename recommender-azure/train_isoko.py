"""
Isoko recommender — training on the Isoko catalog (content-based).

Reads isoko_products.json, builds TF-IDF vectors from each product's title +
category + description (+ category synonyms so same-category items cluster), and
saves an *id-keyed* cosine-similarity model to model/model.pkl. The serving app
returns Isoko product IDs, which the Next.js storefront hydrates directly.

Run:
  pip install scikit-learn pandas
  python train_isoko.py
"""
import json
import os
import pickle

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA = os.environ.get("ISOKO_DATA", "isoko_products.json")
OUT_DIR = os.environ.get("OUT_DIR", "model")

# Extra words per category so products in the same category are pulled together.
CAT_SYNONYMS = {
    "fashion": "fashion clothing apparel wear outfit style",
    "electronics": "electronics gadget device tech audio wireless",
    "home": "home living decor household handmade craft",
    "beauty": "beauty skincare cosmetics makeup face skin",
    "accessories": "accessories accessory leather jewellery bag",
    "phones": "phones smartphone mobile device electronics tech",
}


def main() -> None:
    with open(DATA, encoding="utf-8") as f:
        products = json.load(f)

    df = pd.DataFrame(products)
    df["tags"] = (
        df["title"] + " " + df["cat"].map(lambda c: CAT_SYNONYMS.get(c, c)) + " " + df["desc"]
    ).str.lower()

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf = vectorizer.fit_transform(df["tags"])
    cosine_sim = cosine_similarity(tfidf, tfidf)

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, "model.pkl")
    with open(out, "wb") as f:
        pickle.dump(
            {
                "catalog": "isoko",
                "ids": df["id"].tolist(),
                "titles": df["title"].tolist(),
                "cats": df["cat"].tolist(),
                "cosine_sim": cosine_sim,
            },
            f,
        )
    print(f"Saved {out}  ({len(df)} Isoko products)")


if __name__ == "__main__":
    main()
