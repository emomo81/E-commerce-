"""
Deploy the Isoko recommender to an Azure ML Managed Online Endpoint (SDK v2).

Prereqs:
  pip install azure-ai-ml azure-identity
  az login
  python train.py        # produces model/model.pkl first

Config via environment variables (or edit the defaults below):
  AZ_SUBSCRIPTION_ID, AZ_RESOURCE_GROUP, AZ_WORKSPACE
  AZ_ENDPOINT_NAME (default: isoko-recs)
  AZ_INSTANCE_TYPE (default: Standard_DS2_v2)

Run:
  python deploy.py
"""
import os

from azure.ai.ml import MLClient
from azure.ai.ml.constants import AssetTypes
from azure.ai.ml.entities import (
    CodeConfiguration,
    Environment,
    ManagedOnlineDeployment,
    ManagedOnlineEndpoint,
    Model,
)
from azure.identity import DefaultAzureCredential

SUBSCRIPTION = os.environ["AZ_SUBSCRIPTION_ID"]
RESOURCE_GROUP = os.environ["AZ_RESOURCE_GROUP"]
WORKSPACE = os.environ["AZ_WORKSPACE"]
ENDPOINT = os.environ.get("AZ_ENDPOINT_NAME", "isoko-recs")
INSTANCE_TYPE = os.environ.get("AZ_INSTANCE_TYPE", "Standard_DS2_v2")


def main() -> None:
    ml = MLClient(
        DefaultAzureCredential(),
        subscription_id=SUBSCRIPTION,
        resource_group_name=RESOURCE_GROUP,
        workspace_name=WORKSPACE,
    )

    # 1) Register the model folder (this dir contains model/model.pkl).
    print("Registering model…")
    model = ml.models.create_or_update(
        Model(path=".", name="isoko-recs", type=AssetTypes.CUSTOM_MODEL)
    )

    # 2) Create the runtime environment from conda + a curated base image.
    print("Creating environment…")
    env = ml.environments.create_or_update(
        Environment(
            name="isoko-recs-env",
            image="mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04",
            conda_file="conda.yaml",
        )
    )

    # 3) Create (or update) the endpoint with key auth.
    print(f"Creating endpoint '{ENDPOINT}'…")
    ml.online_endpoints.begin_create_or_update(
        ManagedOnlineEndpoint(name=ENDPOINT, auth_mode="key")
    ).result()

    # 4) Create the 'blue' deployment.
    print("Creating deployment 'blue' (this can take ~10 min)…")
    deployment = ManagedOnlineDeployment(
        name="blue",
        endpoint_name=ENDPOINT,
        model=model,
        environment=env,
        code_configuration=CodeConfiguration(code=".", scoring_script="score.py"),
        instance_type=INSTANCE_TYPE,
        instance_count=1,
    )
    ml.online_deployments.begin_create_or_update(deployment).result()

    # 5) Route 100% of traffic to it.
    endpoint = ml.online_endpoints.get(ENDPOINT)
    endpoint.traffic = {"blue": 100}
    ml.online_endpoints.begin_create_or_update(endpoint).result()

    info = ml.online_endpoints.get(ENDPOINT)
    print("\nDeployed ✓")
    print("Scoring URI:", info.scoring_uri)
    print("Get the key with:")
    print(f"  az ml online-endpoint get-credentials -n {ENDPOINT} "
          f"-g {RESOURCE_GROUP} -w {WORKSPACE}")


if __name__ == "__main__":
    main()
