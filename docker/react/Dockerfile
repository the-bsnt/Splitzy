FROM node:20-slim

ENV APP_HOME=/frontend
WORKDIR $APP_HOME


# Copy package definition files
COPY package*.json .

# Install all dependencies
RUN npm install

# Copying rest of code
COPY . .

# Expose port
EXPOSE 5173

CMD [ "npm","run","dev" ]

