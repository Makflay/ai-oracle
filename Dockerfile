FROM node:24-bookworm AS dependencies

WORKDIR /app

ENV npm_config_update_notifier=false

COPY package.json package-lock.json ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci


FROM dependencies AS source

COPY . .


FROM source AS server

RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "run", "start:server"]


FROM source AS client

RUN npm run build:client

EXPOSE 4173

CMD ["npm", "run", "preview", "--workspace", "client", "--", "--host", "0.0.0.0", "--port", "4173"]