# syntax = docker/dockerfile:1

# Based on https://bun.sh/guides/ecosystem/docker
ARG BUN_VERSION=1.2.2


FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /usr/src/app

LABEL fly_launch_runtime="Bun"

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS backend_install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production


# Need to install vite and tailwind to generate bundled frontend
FROM base AS frontend_install

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3
RUN mkdir -p /temp/prod
# Copy application code
COPY . /temp/prod/
COPY package-lock.json package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun --frozen-lockfile install
RUN cd /temp/prod && bun run build 


# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=backend_install /temp/dev/node_modules node_modules
COPY . .


# copy production dependencies and source code into final image
FROM base AS release

COPY --from=backend_install /temp/prod/node_modules node_modules
COPY --from=frontend_install /temp/prod/public public/
COPY --from=prerelease /usr/src/app/src/server/index.ts src/server/
COPY --from=prerelease /usr/src/app/package.json .

# Start the server by default, this can be overwritten at runtime
USER bun
EXPOSE 3000/tcp
CMD [ "bun", "src/server/index.ts" ]
