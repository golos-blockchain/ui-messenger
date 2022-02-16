FROM node:16.1 as build

WORKDIR /var/app
COPY . /var/app
RUN yarn install
RUN yarn build

FROM node:16.1 as production

WORKDIR /var/app
COPY --from=build /var/app /var/app
ENV PORT 8080

EXPOSE 8080
CMD [ "yarn", "run", "prod" ]
