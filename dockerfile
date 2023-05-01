FROM node:20.0

# Create app directory
WORKDIR /usr/src/app

# Update npm
# RUN npm install npm@5.3.0
# RUN rm -rf /usr/local/lib/node_modules/npm
# RUN mv node_modules/npm /usr/local/lib/node_modules/npm

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm ci

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080
EXPOSE 9229

CMD if [ $NODE_ENV = production ] ; then npm start ; else npm run nodemon ; fi