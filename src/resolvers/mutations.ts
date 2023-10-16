
import {User, AddUserMutationResponse, AddVoteMutationResponse, MutationResolvers, VoteInput } from '../__generated__/resolvers-types';

import { CreateNewsEventInput } from '../__generated__/resolvers-types';
import { pubsub } from './pubsub.js';
import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();
import { DataSourcesMongo } from '../datasourcesmongo.js';
const dataSourcesMongo = new DataSourcesMongo();


const validateVote = (vote: VoteInput): Boolean => {
    const isEmpty: Boolean = Object.values(vote).some(x => x === null || x === '');
    return isEmpty
}

// Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {

    createNewsEvent: (_parent : any, args : CreateNewsEventInput ) => {
        console.log('args:', args);
        pubsub.publish('EVENT_CREATED', { newsFeed: args });
        return args;
    },

  addUser: async (_, { name, email, address, age }: User): Promise<AddUserMutationResponse> => {
    console.log("mutation addUser....")
    return dataSourcesMongo.addUser({ name: name, email: email, address: address, age: age });
  },

//   addVote: async (_, vote: VoteInput, { dataSources }): Promise<AddVoteMutationResponse>  => {
  addVote: async (_, vote: VoteInput): Promise<AddVoteMutationResponse>  => {
    console.log("addVote async mutations...")
    if (validateVote(vote)) {
        // possibility to filter publish: withFilter
        pubsub.publish('EVENT_VOTEADDED', { voteAdded: vote });
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