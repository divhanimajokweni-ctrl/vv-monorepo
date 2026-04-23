#!/bin/bash
# File: scripts/01-bootstrap-repo.sh
# Bootstrap the repository structure

echo "Bootstrapping vv-monorepo..."

# Create directory structure
mkdir -p packages/safekrypte/src
mkdir -p packages/safestakes/src
mkdir -p packages/mainframe/src
mkdir -p scripts

echo "Repository structure created."
echo "Bootstrap complete."