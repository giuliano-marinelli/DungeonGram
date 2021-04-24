FROM node:12.16.1
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD npm start
