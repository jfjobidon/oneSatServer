// import { clearScreenDown } from 'readline';
// import { AddUserMutationResponse, AddVoteMutationResponse, MutationResolvers, User, Vote, VoteInput } from '../__generated__/resolvers-types';
// import { PubSub } from 'graphql-subscriptions';
// const pubsub = new PubSub()

// // Use the generated `MutationResolvers` type to type check our mutations!
// const mutations: MutationResolvers = {
//   // Below, we mock adding a new user. Our data set is static for this
//   // example, so we won't actually modify our data.
//   addUser: async (_, { name, email, address, age }: User, { dataSources }): Promise<AddUserMutationResponse> => {
//     console.log("mutation adding user....")
//     return dataSources.usersAPI.addUser({ name: name, email: email, address: address, age: age });
//   },

//   // TODO: remplacer par un objet VOTE
//   // addVote: async (_, { voterID, invoice, date, campaignID, pollID, certified }: VoteInput, { dataSources }): Promise<AddVoteMutationResponse>  => {
//   //   console.log("addVote async mutations...")
//   //   pubsub.publish('EVENT_VOTEADDED', { voteAdded: { voterID, invoice, date, campaignID, pollID, certified } });
//   //   return dataSources.redisAPI.addVote({ voterID: voterID, invoice: invoice, date: date, campaignID: campaignID, pollID: pollID, certified: certified });
//   // }
//   addVote: async (_, vote: Vote, { dataSources }): Promise<AddVoteMutationResponse>  => {
//     console.log("addVote async mutations...")
//     pubsub.publish('EVENT_VOTEADDED', { voteAdded: vote });
//     return dataSources.redisAPI.addVote(vote);
//   }
// };

// export default mutations;
export {}