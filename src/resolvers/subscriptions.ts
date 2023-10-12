import { SubscriptionResolvers } from "../__generated__/resolvers-types";
// import { PubSub } from 'graphql-subscriptions';
// const pubsub = new PubSub()
import { pubsub } from "./pubsub.js";

// https://github.com/davidyaha/graphql-redis-subscriptions
// https://www.npmjs.com/package/graphql-subscriptions
// import { withFilter } from 'graphql-subscriptions';
// Subscription: {
//     somethingChanged: {
//       subscribe: withFilter(() => pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC), (payload, variables) => {
//         return payload.somethingChanged.id === variables.relevantId;
//       }),
//     },
//   }
const subscriptions: SubscriptionResolvers = {
    voteAdded: {
        // subscribe: () => pubsub.asyncIterator(['EVENT_VOTEADDED'])
        // https://github.com/apollographql/apollo-server/issues/4556
        subscribe: () => ({
            [Symbol.asyncIterator]: () => pubsub.asyncIterator(['EVENT_VOTEADDED']),
        }),
    },
    newsFeed: {
        // subscribe: () => pubsub.asyncIterator(['EVENT_CREATED'])
        subscribe: () => ({
            [Symbol.asyncIterator]: () => pubsub.asyncIterator(['EVENT_CREATED']),
        }),
    }
}

export default subscriptions;
// export {}