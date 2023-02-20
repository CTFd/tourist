FROM node:18-alpine AS builder
WORKDIR /build
COPY . .
RUN yarn && yarn build

FROM mcr.microsoft.com/playwright:v1.27.1-focal
LABEL org.opencontainers.image.source="https://github.com/CTFd/Tourist"
RUN adduser --uid 1001 --disabled-login tourist
USER tourist

WORKDIR /app
COPY package.json .
COPY --from=builder /build/out ./src

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

RUN yarn --production
CMD ["yarn", "start:serve"]
