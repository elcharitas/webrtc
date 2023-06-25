# Set the base image to Node 18
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock into the working directory
COPY package.json yarn.lock ./

# Install packages using yarn
RUN yarn install

# Copy the rest of the application code into the working directory
COPY . .

# Expose the port the app will run on
EXPOSE 4173

# Start the app
CMD ["yarn", "start"]
