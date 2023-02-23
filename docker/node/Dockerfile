FROM node:19

ENV WORKDIR /app
WORKDIR $WORKDIR

COPY ./src/package.json ./src/yarn.lock ./

RUN apt-get update 
RUN yarn install

RUN cat package.json
RUN ls -la node_modules
