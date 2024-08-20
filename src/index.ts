// NOTE: pour merger cette branche sur master et écraser master
// https://javaetmoi.com/2013/08/ecraser-une-branche-par-une-autre-avec-git/

import { ApolloServer } from '@apollo/server';
import express from 'express';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
// import { createServer } from 'http';
import http from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import { readFileSync } from 'fs';

// TODO: put roles in token instead of headers
import { applyMiddleware } from 'graphql-middleware'
import { permissions } from './permissions.js';

import 'dotenv/config'
import config from "config";
console.log(`server started on ${process.env.NODE_ENV} mode`);
process.env.DBURI = config.get<string>('DBURI');
process.env.port = config.get<string>('port');
const PORT = process.env.port || 4000 // default dev

console.log(`server started on ${process.env.DBURI} mode`);

// TODO: test this: read file that doesnt exist
// process.on('uncaughtException', err => {
//   console.log(`There was an uncaught error: ${err}`)
//   process.exit(1)
// })

import { GraphQLScalarType, Kind } from 'graphql';

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }
    throw Error('GraphQL Date Scalar serializer expected a `Date` object');
  },
  parseValue(value) {
    if (typeof value === 'number') {
      return new Date(value); // Convert incoming integer to Date
    }
    throw new Error('GraphQL Date Scalar parser expected a `number`');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      // Convert hard-coded AST string to integer and then to Date
      return new Date(parseInt(ast.value, 10));
    }
    // Invalid hard-coded value (not an integer)
    return null;
  },
});

import resolvers from "./resolvers/index.js";

const typeDefs = readFileSync('schema.graphql', { encoding: 'utf-8' }); // REVIEW: Error message (callback fct)

interface MyContext {
  token?: string;
  roles?: string;
  userId?: string;
}

let schema = makeExecutableSchema({ typeDefs, resolvers });
// schema = applyMiddleware(schema, permissions)
schema = applyMiddleware(schema)

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = http.createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/" // localhost:3000/
  // path: "/graphql" // localhost:3000/graphql
});

const serverCleanup = useServer({ schema }, wsServer);

// const server = new ApolloServer<MyContext>({
//   typeDefs,
//   resolvers,
//   plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
// });

const server = new ApolloServer<MyContext>({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() { // Proper shutdown for the WebSocket server
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  '/',
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(
    server,
    {
      context: async ({ req }) => ({
        token: req.headers.token,
        roles: req.headers.roles,
        userId: req.headers.userId
      })
      // context: async ({ req }) => {
      //   // get the user token from the headers
      //   const token = req.headers.authorization || '';
    
      //   // try to retrieve a user with the token
      //   const user = getUser(token);
    
      //   // optionally block the user
      //   // we could also check user roles/permissions here
      //   if (!user)
      //     // throwing a `GraphQLError` here allows us to specify an HTTP status code,
      //     // standard `Error`s will have a 500 status code by default
      //     throw new GraphQLError('User is not authenticated', {
      //       extensions: {
      //         code: 'UNAUTHENTICATED',
      //         http: { status: 401 },
      //       },
      //     });
    
      //   // add the user to the context
      //   return { user };
      // },
    })
);

await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}/`);