# syntax=docker/dockerfile:1

FROM node:16.15.1

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install --production

COPY . .

RUN npm run build

CMD [ "node", "dist/main.js", "server" ]
