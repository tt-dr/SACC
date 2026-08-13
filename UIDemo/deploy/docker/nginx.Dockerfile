FROM node:22-alpine AS home-builder
WORKDIR /workspace
COPY sacc-home/package.json sacc-home/package-lock.json ./sacc-home/
WORKDIR /workspace/sacc-home
RUN npm ci --no-audit --no-fund
WORKDIR /workspace
COPY SACC.pen ./SACC.pen
COPY download.png ./download.png
COPY sacc-home ./sacc-home
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /workspace/sacc-home
RUN npm run build

FROM node:22-alpine AS admin-builder
WORKDIR /workspace
COPY sacc-admin/package.json sacc-admin/package-lock.json ./sacc-admin/
WORKDIR /workspace/sacc-admin
RUN npm ci --no-audit --no-fund
WORKDIR /workspace
COPY sacc-admin ./sacc-admin
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /workspace/sacc-admin
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=home-builder /workspace/sacc-home/dist /usr/share/nginx/html
COPY --from=admin-builder /workspace/sacc-admin/dist /usr/share/nginx/html/admin
