FROM node:20.19.0 as build

WORKDIR /var/app
COPY . /var/app
RUN yarn install
RUN yarn build
RUN node git-install.js -c

FROM node:20.19.0-alpine

WORKDIR /var/app
COPY --from=build /var/app /var/app
ENV PORT 8080

EXPOSE 8080
CMD [ "yarn", "run", "prod" ]
