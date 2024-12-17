FROM node:20-alpine
RUN apk add --no-cache make g++ python3
WORKDIR /app
COPY package*.json ./
RUN npm install bcrypt --build-from-source && npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
