FROM denoland/deno:latest AS base
WORKDIR /app

COPY deno.json deno.lock ./
RUN deno install

COPY . .
RUN deno cache src/index.ts

EXPOSE 4003

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
