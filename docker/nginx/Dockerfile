# Stage 1: Build frontend
FROM node:20-slim AS react

ENV APP_HOME=/frontend
WORKDIR $APP_HOME


# Copy package definition files
COPY frontend/package*.json .

# Install all dependencies
RUN npm install

# Copying rest of code
COPY frontend .

# For react build
RUN npm run build

# Stage 2: Nginx to serve the build
FROM nginx:1.21.3-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the previous stage
COPY --from=react /frontend/dist /usr/share/nginx/html

# Expose port
EXPOSE 80


