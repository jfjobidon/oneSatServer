// import { AddUserMutationResponse, AddVoteMutationResponse, MutationResolvers, User, Vote, VoteInput } from '../__generated__/resolvers-types';
import {AddVoteMutationResponse, MutationResolvers, Vote, VoteInput } from '../__generated__/resolvers-types';

import { CreateNewsEventInput } from '../__generated__/resolvers-types';
import { pubsub } from './pubsub.js';
import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();


const validateVote = (vote: VoteInput): Boolean => {
    const isEmpty = Object.values(vote).some(x => x === null || x === '');
    console.log('vote has null value(s): ', isEmpty)
    return isEmpty
}


// // Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {

    createNewsEvent: (_parent : any, args : CreateNewsEventInput ) => {
        console.log('args:', args);
        pubsub.publish('EVENT_CREATED', { newsFeed: args });

        // Save news events to a database: you can do that here!

        // Create something : EVENT_CREATED
        // Subscribe to something: EVENT_CREATED
        return args;
    },

//   // Below, we mock adding a new user. Our data set is static for this
//   // example, so we won't actually modify our data.
//   addUser: async (_, { name, email, address, age }: User, { dataSources }): Promise<AddUserMutationResponse> => {
//     console.log("mutation adding user....")
//     return dataSources.usersAPI.addUser({ name: name, email: email, address: address, age: age });
//   },

//   addVote: async (_, vote: VoteInput, { dataSources }): Promise<AddVoteMutationResponse>  => {
  addVote: async (_, vote: VoteInput): Promise<AddVoteMutationResponse>  => {
    console.log("addVote async mutations...")
    pubsub.publish('EVENT_VOTEADDED', { voteAdded: vote });
    // return dataSources.redisAPI.addVote(vote);
    if (validateVote(vote)) {
        return {
            code: "400",
            success: false,
            message: "Problem adding new vote!",
            vote: null
          }
    } else {
        return await dataSourcesRedis.addVote(vote);
    }
  }
};

export default mutations;