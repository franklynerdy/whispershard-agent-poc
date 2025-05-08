FROM node:18
WORKDIR /app
COPY . .
RUN npm install express body-parser node-fetch
EXPOSE 3000
CMD ["node", "index.js"]
