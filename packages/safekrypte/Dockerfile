FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY packages/safekrypte/ ./packages/safekrypte/
COPY packages/shared-kernel/ ./packages/shared-kernel/

WORKDIR /app/packages/safekrypte

EXPOSE 3001

CMD ["npx", "tsx", "src/simulator.ts"]