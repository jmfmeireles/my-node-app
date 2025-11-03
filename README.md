# My Node App

## Overview
This application serves as a learning project for Node.js and Express, showcasing various web development concepts.

### Key Components
- **CRUD Implementations**: The app includes Create, Read, Update, and Delete operations, which are fundamental for interacting with databases.
- **Databases**: It utilizes both SQL (likely for structured data) and NoSQL (like MongoDB for unstructured data) databases, demonstrating versatility in data handling.
- **Authentication and Authorization**: The app features basic user authentication (verifying user identity) and authorization (controlling access to resources), which are crucial for securing web applications.
- **Error Handling**: Proper error handling is implemented to manage and respond to issues that may arise during application execution, enhancing user experience and debugging.

## Installation and Running
1. **Create a MongoDB database**: Here I am using Atlas to create it online. For more information you can refer to the next section
2. **Install Dependencies**: Run `npm install` to install all necessary dependencies defined in `package.json`.
3. **Environment Variables**: Create a `.env` file for storing environment variables, such as database connection strings and secret keys, which should not be hard-coded in the application.
4. **Seed local database**: You can populate the local SQL database by running `node utils/seedDatabase.js`. This is done having into account the models developed on `models/sqlTablesModels`
5. **Start Application**: Use `npm run dev` to start the application in development mode, typically with features like hot reloading for easier development.

## MongoDB Connection
Instructions are provided to connect to a MongoDB Atlas database, which is a cloud-based NoSQL database service. This involves copying a connection string and replacing placeholders with actual credentials. For detailed instructions on how to create and connect to a MongoDB Atlas database, please refer to the official MongoDB documentation: [Create and Connect to a MongoDB Atlas Cluster](https://docs.atlas.mongodb.com/getting-started/).

## Environment Variables
**ATLAS_URI**: This variable contains the connection string for your MongoDB Atlas database. It includes the username, password, and the cluster information needed to connect to your database. For more information 
**SECRET_KEY**: This is a secret key used for signing tokens. It should be kept confidential to ensure the security of your application.
**CLIENT_ID**: This variable holds the client ID for your application when using OAuth 2.0 for authentication with Google services. It uniquely identifies your application to Google's authentication system.
**CLIENT_SECRET**: This is the client secret associated with your application, used in conjunction with the client ID to authenticate your application with Google services. Like the secret key, it should be kept confidential.
**REDIRECT_URI**: This variable specifies the URI to which users will be redirected after they authenticate with Google. It is essential for handling the response from the authentication process.

## Testing the Application
There are several endpoints that you can test inside the following routes:
**auth**: Handles user authentication and authorization (access control).
**authors**: Manages CRUD operations (Create, Read, Update, Delete) for author records in a SQL database.
**books**: Manages CRUD operations for book records in a SQL database.
**comments**: Handles CRUD operations for comments in a NoSQL database.
**movies**: Manages CRUD operations for movie records in a NoSQL database.

## Unit tests
WIP
