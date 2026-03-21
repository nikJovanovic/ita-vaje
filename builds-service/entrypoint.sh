#!/bin/sh
set -e

echo "Running migrations..."
bun run db:migrate

echo "Seeding database..."
bun run db:seed

echo "Starting builds-service..."
exec bun run start
