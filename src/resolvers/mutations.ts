import { MutationResolvers } from '../__generated__/resolvers-types';

// Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {
  // Below, we mock adding a new user. Our data set is static for this
  // example, so we won't actually modify our data.
  addUser: async (_, { name, email, address, age }, { dataSources }) => {
    return dataSources.usersAPI.addUser({ name: name, email: email, address: address, age: age });
  },
};

export default mutations;