export {}
import { QueryResolvers } from "../__generated__/resolvers-types";

// Use the generated `QueryResolvers` type to type check our queries!
const queries: QueryResolvers = {
  // Our third argument (`contextValue`) has a type here, so we
  // can check the properties within our resolver's shared context value.

  getUsers: async (_, __, { dataSources }) => {
    console.log("getUsers from client");
    return await dataSources.usersAPI.getUsers();
  },
  
  getUser: async (_, args, { dataSources }) => {
    return dataSources.usersAPI.getUser(args.name);
  },


  getVotes: async (_, __, { dataSources }) => {
    console.log("getVotes from client");
    return await dataSources.redisAPI.getVotes();
    // let x = await dataSources.redisAPI.getVotes();
    // console.log('get votes: ' + JSON.stringify(x, null, 2));
    // return { votes: "all votes" }
  }

  // getVotes: async (_, __, { dataSources }) => {
  //   console.log("getVotes from client");
  //   // return await dataSources.redisAPI.getVotes();
  //   let x = await dataSources.redisAPI.getVotes();
  //   console.log(x)
  //   // return { votes: "thevotes"}
  //   return "all votes"
  // }
}

export default queries;
