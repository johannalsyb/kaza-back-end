#!/bin/bash
docker run --rm --name=reverseproxy -p "4444:4444" -v "$(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf" nginx:alpine