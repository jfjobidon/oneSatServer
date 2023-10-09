import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { UsersDataSource } from "./datasources.js";
import { DataSourcesRedis } from './datasourcesredis.js';

import resolvers from "./resolvers/index.js";

const typeDefs = readFileSync('./schema.graphql', { encoding: 'utf-8' });

export interface MyContext {
    dataSources: {
        usersAPI: UsersDataSource,
        redisAPI: DataSourcesRedis
    };
}

const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
  });


  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        // We are using a static data set for this example, but normally
        // this would be where you'd add your data source connections
        // or your REST API classes.
        dataSources: {
          usersAPI: new UsersDataSource(),
          redisAPI: new DataSourcesRedis(),
        },
      };
    },
  });
  
  console.log(`🚀  Server ready at: ${url}`);