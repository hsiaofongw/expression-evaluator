#!/bin/sh

fullTagName="ghcr.io/hsiaofongw/expression-evaluator:$1"
echo "Full tag name is $fullTagName"

docker buildx build \
--platform=linux/amd64 \
--push \
-t $fullTagName .
