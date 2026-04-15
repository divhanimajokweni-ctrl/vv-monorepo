#!/bin/bash
# Get the current Git SHA (short version)
NEW_TAG=$(git rev-parse --short HEAD)

echo "Updating Dev image tag to: $NEW_TAG"

# Use yq (standard in most dev environments) to patch the dev-values.yaml
# If yq isn't installed, we can use a simple sed command:
sed -i "s/tag: .*/tag: \"$NEW_TAG\"/" overlays/helm/up/dev-values.yaml

echo "Done. Commit these changes to trigger ArgoCD."
