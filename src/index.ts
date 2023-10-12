// import { ApolloServer } from '@apollo/server';
// import { startStandaloneServer } from '@apollo/server/standalone';
// import { readFileSync } from 'fs';
// import { UsersDataSource } from "./datasources.js";
// import { DataSourcesRedis } from './datasourcesredis.js';

// import resolvers from "./resolvers/index.js";

// const typeDefs = readFileSync('./schema.graphql', { encoding: 'utf-8' });

// export interface MyContext {
//     dataSources: {
//         usersAPI: UsersDataSource,
//         redisAPI: DataSourcesRedis
//     };
// }
// interface MyContext {
//   token?: string;
//   dataSources: {
//     usersAPI: UsersDataSource,
//     redisAPI: DataSourcesRedis
//   };
// }

// const server = new ApolloServer<MyContext>({
//     typeDefs,
//     resolvers,
//   });


//   const { url } = await startStandaloneServer(server, {
//     context: async () => {
//       return {
//         // We are using a static data set for this example, but normally
//         // this would be where you'd add your data source connections
//         // or your REST API classes.
//         dataSources: {
//           usersAPI: new UsersDataSource(),
//           redisAPI: new DataSourcesRedis(),
//         },
//       };
//     },
//   });

//   console.log(`🚀  Server ready at: ${url}`);

// ----------------------------


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

// interface createNewsEventInput {
//   title: string
//   description: string
// }

// const resolvers = {
//   Query: {
//       placeholder: () => { return true }
//   },
//   Mutation: {
//       createNewsEvent: (_parent : any, args : createNewsEventInput ) => {
//           console.log(args);
//           pubsub.publish('EVENT_CREATED', { newsFeed: args });

//           // Save news events to a database: you can do that here!

//           // Create something : EVENT_CREATED
//           // Subscribe to something: EVENT_CREATED
//           return args;
//       }
//   },
//   Subscription: {
//       newsFeed: {
//           subscribe: () => pubsub.asyncIterator(['EVENT_CREATED'])
//       }
//   }
// }
// const resolvers = {
//   Query: {
//     getUsers: async (_, __, args) => {
//       console.log(args)
//       // return UsersDataSource.getUsers()
//       // let x = rect.area()
//       return [{
//         email: "email01",
//         name: "name01",
//         address: 'address01',
//         age: 11
//       }]
//     },
//   },
//   Mutation: {
//     addVote: async (_, vote: VoteInput, { dataSources }): Promise<AddVoteMutationResponse> => {
//       console.log("addVote async mutations...")
//       pubsub.publish('EVENT_VOTEADDED', { voteAdded: vote });
//       return dataSources.redisAPI.addVote(vote);
//     }
//   },
//   Subscription: {
//     voteAdded: {
//       // subscribe: () => pubsub.asyncIterator(['EVENT_VOTEADDED'])
//       // https://github.com/apollographql/apollo-server/issues/4556
//       subscribe: () => ({
//         [Symbol.asyncIterator]: () => pubsub.asyncIterator(['EVENT_VOTEADDED']),
//       }),
//     }
//   }
// }

const schema = makeExecutableSchema({ typeDefs, resolvers });

// const pubsub = new PubSub(); // Publish and Subscribe, Publish -> everyone gets to hear it

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

// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
// const schema = makeExecutableSchema({ typeDefs, resolvers });


// Create our WebSocket server using the HTTP server we just set up.
// const wsServer = new WebSocketServer({
//   server: httpServer,
//   path: '/subscriptions', // path: "/graphql" // localhost:3000/graphql
// });
// Save the returned server's info so we can shutdown this server later
// const serverCleanup = useServer({ schema }, wsServer);

// Set up ApolloServer.
// const server = new ApolloServer<MyContext>({
//   schema,
//   plugins: [
//     // Proper shutdown for the HTTP server.
//     ApolloServerPluginDrainHttpServer({ httpServer }),
//     {
//       async serverWillStart() { // Proper shutdown for the WebSocket server
//         return {
//           async drainServer() {
//             await serverCleanup.dispose();
//           },
//         };
//       },
//     },
//   ],
// });

// await server.start();
// app.use('/graphql', cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(server));

// const PORT = 4000;
// // Now that our HTTP server is fully set up, we can listen to it.
// httpServer.listen(PORT, () => {
//   console.log(`Server is now running on http://localhost:${PORT}/graphql`);
// });