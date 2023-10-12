import { QueryResolvers } from "../__generated__/resolvers-types";

import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();

import { DataSourcesMongo } from "../datasourcesmongo.js";
const dataSourcesMongo = new DataSourcesMongo()

const queries: QueryResolvers = {


  placeholder: async (_, __generated__) => { 
    return true
  },

  getUsers: async (_, __) => {
    let users = await dataSourcesMongo.getUsers();
    console.table(users);
    return users
  },
  
  getUserById: async (_, args) => {
    return dataSourcesMongo.getUserById(args.id);
  },
  
  getUserByName: async (_, args) => {
    return dataSourcesMongo.getUserByName(args.name);
  },

  getVotes: async (_, __) => {
    console.log("getVotes from client");
    return await dataSourcesRedis.getVotes();
  },

  getVoteById: async (_, args) => {
    return dataSourcesRedis.getVoteById(args.id);
  },
}

export default queries;
