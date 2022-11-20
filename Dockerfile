FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn
COPY . .
RUN ls -las
EXPOSE $PORT
ENTRYPOINT yarn start