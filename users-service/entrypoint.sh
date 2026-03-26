#!/bin/sh
set -e

echo "Running migrations..."
deno task db:migrate

echo "Seeding database..."
deno task db:seed

echo "Starting users-service..."
exec deno task start
