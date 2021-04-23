FROM node:12.16.1
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
ENV MONGODB_URI mongodb+srv://admin:larengagms157@dungeongram.jz3dr.mongodb.net/dungeongram?retryWrites=true&w=majority
ENV AWS_UPLOAD yes
RUN npm install
RUN npm run build
EXPOSE 3000
CMD npm start
