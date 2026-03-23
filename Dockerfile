FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Store tracker and logs in a volume-friendly directory
ENV STORE_FILE=/app/data/.posted-ids.json
ENV LOG_FILE=/app/data/bot.log

RUN mkdir -p /app/data

CMD ["node", "index.js"]
