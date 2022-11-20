FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn
COPY . .
RUN ls -las
EXPOSE 7002
ENTRYPOINT yarn start