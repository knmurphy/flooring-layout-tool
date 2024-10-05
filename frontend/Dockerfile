# Use Node image to build and run the application
FROM node:18

# Set the working directory
WORKDIR /usr/src/frontend

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Start the application in development mode
CMD ["yarn", "serve"]
