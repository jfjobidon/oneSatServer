import { Resolvers } from "../__generated__/resolvers-types";
import Query from "./queries.js";
import Mutation from "./mutations.js";
import Subscription from './subscriptions.js';
// import queries from "./queries.js";
// import mutations from "./mutations.js";
// import subscriptions from './subscriptions'

// Note this "Resolvers" type isn't strictly necessary because we are already
// separately type checking our queries and resolvers. However, the "Resolvers"
// generated types is useful syntax if you are defining your resolvers
// in a single file.
const resolvers: Resolvers = { Query, Mutation, Subscription };
// const resolvers: Resolvers = { queries, mutations };

export default resolvers;