import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served `Dockerfile` (CWE-200). Scanners read it for two
// things: the pinned base images and package versions, which feed downstream
// CVE matching, and build-time secrets — `ARG`/`ENV` is the classic place a
// private-registry token or database URL ends up baked into an image layer.
//
// Shaped as a realistic multi-stage Node build so the disclosed structure is
// plausible: build stage, a non-root runtime user, `HEALTHCHECK`, and an
// `ARG NPM_TOKEN` wired through to `.npmrc` exactly the way a real
// private-dependency build does it. The token and every other secret resolve
// to the non-actionable placeholder; registry hosts are `.invalid`. Fully
// static; never reflects the request.

const body = `# syntax=docker/dockerfile:1.7

FROM node:20.11-alpine AS build

ARG NPM_TOKEN=REDACTED_FOR_HONEYPOT
ARG BUILD_REVISION=unknown

WORKDIR /srv/app

RUN printf '//npm.internal.invalid/:_authToken=%s\\n@example:registry=https://npm.internal.invalid/\\n' "$NPM_TOKEN" > .npmrc

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN npm run build && rm -f .npmrc

FROM node:20.11-alpine AS runtime

LABEL org.opencontainers.image.source="https://git.internal.invalid/platform/app"
LABEL org.opencontainers.image.vendor="Example"

ENV NODE_ENV=production \\
    PORT=8080 \\
    DATABASE_URL=postgres://app_user:REDACTED_FOR_HONEYPOT@db.internal.invalid:5432/app \\
    REDIS_URL=redis://cache.internal.invalid:6379/0 \\
    SESSION_SECRET=REDACTED_FOR_HONEYPOT

RUN apk add --no-cache tini curl \\
 && addgroup -S app && adduser -S -G app app

WORKDIR /srv/app
COPY --from=build --chown=app:app /srv/app/node_modules ./node_modules
COPY --from=build --chown=app:app /srv/app/dist ./dist
COPY --from=build --chown=app:app /srv/app/package.json ./package.json

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD curl -fsS http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
`;

export const fakeDockerfile: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
