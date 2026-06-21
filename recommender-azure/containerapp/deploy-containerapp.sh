#!/usr/bin/env bash
# Deploy the recommender to Azure Container Apps (scale-to-zero, pay-per-request).
#
# Prereqs:
#   az login
#   az extension add --name containerapp --upgrade
#   python train.py          # from recommender-azure/, creates model/model.pkl
#
# Run from the recommender-azure/ directory:
#   bash containerapp/deploy-containerapp.sh
set -euo pipefail

RG="${AZ_RESOURCE_GROUP:-isoko-rg}"
LOCATION="${AZ_LOCATION:-northeurope}"
ACR="${AZ_ACR:-isokoacr$RANDOM}"          # must be globally unique
ENV="${AZ_CONTAINERAPP_ENV:-isoko-env}"
APP="${AZ_CONTAINERAPP:-isoko-recs}"
IMAGE="isoko-recs:latest"

echo "==> Resource group"
az group create -n "$RG" -l "$LOCATION" -o none

echo "==> Container registry ($ACR)"
az acr create -n "$ACR" -g "$RG" --sku Basic --admin-enabled true -o none

echo "==> Build image in ACR (uses ../Dockerfile context = recommender-azure/)"
az acr build -r "$ACR" -t "$IMAGE" -f containerapp/Dockerfile . -o none

echo "==> Container Apps environment"
az containerapp env create -n "$ENV" -g "$RG" -l "$LOCATION" -o none

echo "==> Deploy app (scale 0..3, ingress 8000)"
az containerapp create \
  -n "$APP" -g "$RG" --environment "$ENV" \
  --image "$ACR.azurecr.io/$IMAGE" \
  --registry-server "$ACR.azurecr.io" \
  --target-port 8000 --ingress external \
  --min-replicas 0 --max-replicas 3 \
  --cpu 0.5 --memory 1.0Gi -o none

FQDN=$(az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo ""
echo "Deployed ✓  https://$FQDN"
echo "Test: curl -X POST https://$FQDN/recommend -H 'content-type: application/json' \\"
echo "        -d '{\"item_name\":\"OPI Infinite Shine, Nail Lacquer Nail Polish, Bubble Bath\",\"top_n\":5}'"
