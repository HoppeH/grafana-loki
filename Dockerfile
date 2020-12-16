FROM node:15.0.1-alpine as base
LABEL org.opencontainers.image.authors=tom.egil.fossaksaret@tine.no
LABEL org.opencontainers.image.title="API for discord bot"
# Set node env
ENV NODE_ENV=production
# Set workdir for container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm config list
# Installing production packages
RUN npm ci \ 
    && npm cache clean --force
# Change path to be able to run nodemon
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# Clean APK cache
RUN rm -rf /var/cache/apk/*


FROM base as dev    
ENV NODE_ENV=development   
RUN npm config list
RUN npm install --only=dev  \
    && npm cache clean --force

# Files and directorys needed for running dev env
COPY ./src /usr/src/app/src
# COPY ./healthcheck.js /usr/src/app


# RUN npm i -g nodemon@1.19.1
RUN npm config list
RUN npm install --only=development \ 
    && npm cache clean --force

# Set user to node
USER node
CMD ["nodemon", "./src/index.ts"]

# Test 
FROM dev as test
USER root
RUN npm audit
CMD ["npm", "run", "test"]

FROM test as test-watch

CMD ["npm", "run", "test:watch"]

# Building JS files for production
FROM test-watch as builder
RUN tsc


# Final production build
FROM builder as prod
# COPY ./xml /usr/src/app/xml
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
CMD ["node", "./dist/index.js"]

# HEALTHCHECK CMD node /usr/src/app/healthcheck.js 
# HEALTHCHECK --interval=12s --timeout=12s --start-period=30s \  
#     CMD node ./healthcheck.js
# HEALTHCHECK --interval=10s --timeout=3s --start-period=10s \
# CMD wget --quiet --tries=1 --spider http://127.0.0.1:8888/healthcheck || exit 1