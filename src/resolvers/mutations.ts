import { clearScreenDown } from 'readline';
import { AddUserMutationResponse, AddVoteMutationResponse, MutationResolvers, User, Vote } from '../__generated__/resolvers-types';

// Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {
  // Below, we mock adding a new user. Our data set is static for this
  // example, so we won't actually modify our data.
  addUser: async (_, { name, email, address, age }: User, { dataSources }): Promise<AddUserMutationResponse> => {
    console.log("mutation adding user....")
    return dataSources.usersAPI.addUser({ name: name, email: email, address: address, age: age });
  },

  addVote: async (_, { voterID, invoice, date, campaignID, pollID, certified }: Vote, { dataSources }): Promise<AddVoteMutationResponse>  => {
    console.log("addVote async mutations...")
    return dataSources.redisAPI.addVote({ voterID: voterID, invoice: invoice, date: date, campaignID: campaignID, pollID: pollID, certified: certified });
  },
};

export default mutations;