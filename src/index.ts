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
import { PubSub } from 'graphql-subscriptions';
const pubsub = new PubSub()
// import { AddVoteMutationResponse, Vote, VoteInput } from './__generated__/resolvers-types';


import resolvers from "./resolvers/index.js";
const typeDefs = readFileSync('./schema.graphql', { encoding: 'utf-8' });
// import { typeDefs, resolvers } from './schema';

interface MyContext {
  token?: string;
}

const schema = makeExecutableSchema({ typeDefs, resolvers });

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
    { context: async ({ req }) => ({ token: req.headers.token }) })
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);