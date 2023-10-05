export {}
import { QueryResolvers } from "../__generated__/resolvers-types";

// Use the generated `QueryResolvers` type to type check our queries!
const queries: QueryResolvers = {
  // Our third argument (`contextValue`) has a type here, so we
  // can check the properties within our resolver's shared context value.

  getUsers: async (_, __, { dataSources }) => {
    console.log("getUsers from client");
    console.log(JSON.stringify(dataSources.usersAPI, null, 2))
    return await dataSources.usersAPI.getUsers();
  },
  
  getUser: async (_, args, { dataSources }) => {
    return dataSources.usersAPI.getUser(args.name);
  }
}

export default queries;
