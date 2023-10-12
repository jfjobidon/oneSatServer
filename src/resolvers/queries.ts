import { QueryResolvers } from "../__generated__/resolvers-types";

import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();

// import { UsersDataSource } from "../datasources";
// const dataSources = new UsersDataSource()
// import { Rectangle } from "../datasources";
// let rect = new Rectangle();
// export class Rectangle{
//   // area(): Number{
//   //   return 23
//   // }
//   async area() {
//     return  24
//   }
// }
// const rect= new Rectangle()

// Use the generated `QueryResolvers` type to type check our queries!

const queries: QueryResolvers = {


  placeholder: async (_, __, args) => { 
    console.log(args)
    return true
  },

  // Our third argument (`contextValue`) has a type here, so we
  // can check the properties within our resolver's shared context value.

  // getUsers: async (_, __, { dataSources }) => {
  //   return await dataSources.usersAPI.getUsers();
  // },

  // getUsers: async (_, __, args) => {
  //   console.log(args)
  //   // return UsersDataSource.getUsers()
  //   // let x = rect.area()
  //   return [{
  //     email:  "email01",
  //     name:   "name01",
  //     address: 'address01',
  //     age:    11
  //   }]
  // },
  
  // getUser: async (_, args, { dataSources }) => {
  //   return dataSources.usersAPI.getUser(args.name);
  // },


  getVotes: async (_, __) => {
    console.log("getVotes from client");
    return await dataSourcesRedis.getVotes();
  }
}

export default queries;
