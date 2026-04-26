FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY packages/safestakes/ ./packages/safestakes/
COPY packages/shared-kernel/ ./packages/shared-kernel/

WORKDIR /app/packages/safestakes

EXPOSE 3002

CMD ["npx", "tsx", "src/simulator.ts"]