FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN cp .env.development .env && npm run build -- --mode development

EXPOSE 3000

CMD ["npm", "start"]
