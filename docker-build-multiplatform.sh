#!/bin/bash

APP="kazaswap"
IMAGE=${IMAGE:-"kazaswap"}
REPO="111014719475.dkr.ecr.eu-west-3.amazonaws.com"
TAG=${TAG:-latest}
AWS_PROFILE=${AWS_PROFILE:-bgr}
AWS_REGION=${AWS_REGION:-eu-west-3}

aws --profile $AWS_PROFILE ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPO

docker buildx ls | grep $APP > /dev/null 2>&1
if [ $? -ne 0 ]; then
    docker buildx create --name $APP
fi

docker buildx use $APP

CACHE=""
if [[ "$NO_CACHE" == "true" ]]; then
  CACHE="--no-cache"
fi

# Get git commit hash
GIT_COMMIT=$(git rev-parse --short HEAD)

# Build web image
docker buildx build \
  --platform linux/arm64 \
  --push \
  --target runner \
  $CACHE \
  -t $REPO/$IMAGE-api:$TAG \
  -t $REPO/$IMAGE-api:$GIT_COMMIT \
  -f ./Dockerfile.api .

# Build cms image
docker buildx build \
  --platform linux/arm64 \
  --push \
  $CACHE \
  -t $REPO/$IMAGE-cms:$TAG \
  -t $REPO/$IMAGE-cms:$GIT_COMMIT \
  -f ./Dockerfile.cms .
