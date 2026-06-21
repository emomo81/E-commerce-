# Isoko Recommender — Azure

The recommendation model (TF-IDF content similarity, restructured from the
SageMaker notebook) packaged for **Azure**. Two deployment options:

| Option | Host | Billing | When to use |
|---|---|---|---|
| **A — Azure ML Managed Online Endpoint** | `deploy.py` | per **instance-hour** (always on) | ML-native tooling, model registry, A/B traffic splits |
| **B — Azure Container Apps** | `containerapp/` | **per request, scales to zero** | lowest cost for spiky e-commerce traffic |

Both serve the **same model** and the same REST contract to the Next.js app.

> The model currently trains on the Walmart 5k sample (what the notebook used).
> **Retrain on your own `user_events` before trusting the recommendations.**

---

## 0. Prereqs

```bash
cd recommender-azure
pip install -r requirements.txt
python -m spacy download en_core_web_sm   # optional (falls back to blank model)
az login
```

Place your training data next to these files as `walmart_5k.tsv`, or set
`DATA_PATH` to a local path / Azure Blob mount.

---

## 1. Train (required for both options)

```bash
python train.py        # -> model/model.pkl
```

---

## Option A — Azure ML Managed Online Endpoint

```bash
export AZ_SUBSCRIPTION_ID=...        # PowerShell: $env:AZ_SUBSCRIPTION_ID="..."
export AZ_RESOURCE_GROUP=...
export AZ_WORKSPACE=...
python deploy.py
```

Get the scoring URI + key:

```bash
az ml online-endpoint get-credentials -n isoko-recs -g <RG> -w <WS>
```

Test:

```bash
curl -X POST "<SCORING_URI>" \
  -H "Authorization: Bearer <PRIMARY_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"item_name":"OPI Infinite Shine, Nail Lacquer Nail Polish, Bubble Bath","top_n":5}'
```

Cost note: a `Standard_DS2_v2` instance runs ~24/7 (~$70–100/mo even idle).

---

## Option B — Azure Container Apps (scale-to-zero)

```bash
az extension add --name containerapp --upgrade
bash containerapp/deploy-containerapp.sh
```

Test (the script prints the URL):

```bash
curl -X POST "https://<app>.azurecontainerapps.io/recommend" \
  -H "content-type: application/json" \
  -d '{"item_name":"OPI Infinite Shine, Nail Lacquer Nail Polish, Bubble Bath","top_n":5}'
```

Scales to zero when idle — you pay only while serving requests.

---

## 2. Connect to the Next.js app

Add to the web app's `.env.local`:

```bash
# Option A (Azure ML):
AZURE_ML_SCORING_URI=
AZURE_ML_KEY=
# Option B (Container Apps): point to https://<app>.azurecontainerapps.io/recommend
RECS_URL=
RECS_KEY=          # only for Option A
```

In `app/api/recommendations/route.ts`, call the endpoint and keep the local
popularity fallback (`lib/recommendations.ts`) for graceful degradation:

```ts
import { popularityFallback } from "@/lib/recommendations";

async function fromAzure(body: { item_name?: string; top_n?: number }) {
  const res = await fetch(process.env.AZURE_ML_SCORING_URI ?? process.env.RECS_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.AZURE_ML_KEY ? { Authorization: `Bearer ${process.env.AZURE_ML_KEY}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),   // PRD: fall back if > 3s
  });
  if (!res.ok) throw new Error("recs_upstream_error");
  return res.json();
}

// inside POST:
try {
  const out = await fromAzure({ item_name: body.product_id, top_n: body.limit ?? 10 });
  return NextResponse.json({ recommendations: out.recommendations ?? out, served_from: "azure" });
} catch {
  return NextResponse.json({ recommendations: popularityFallback(body.limit ?? 10), served_from: "fallback" });
}
```

---

## Files

```
train.py                      Train + serialize model/model.pkl
score.py                      Azure ML scoring script (init/run)   [Option A]
deploy.py                     Register + deploy Managed Online Endpoint [Option A]
conda.yaml                    Endpoint runtime deps                [Option A]
requirements.txt             Local training + deploy tooling
containerapp/
  app.py                      FastAPI service                      [Option B]
  Dockerfile                  Container image                      [Option B]
  requirements.txt            Container runtime deps               [Option B]
  deploy-containerapp.sh      ACR build + Container Apps deploy     [Option B]
```
