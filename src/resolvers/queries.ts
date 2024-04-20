import { QueryResolvers, UserMutationResponse } from "../__generated__/resolvers-types";

import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();

import { DataSourcesMongo } from "../datasourcesmongo.js";
import { GraphQLError } from "graphql";
const dataSourcesMongo = new DataSourcesMongo()
import { testenv } from '../utils/jwt.js';
import bcrypt from "bcrypt";
import { JwtUtil } from "../utils/jwt.js";
const jwtUtil = new JwtUtil()

const queries: QueryResolvers = {

  placeholder: async (_, __generated__) => {
    return true
  },

  getUsers: async (_, __, context) => {
    // testenv()
    console.table(context)
    console.log(typeof context.roles)
    let users = await dataSourcesMongo.getUsers();
    // if (true) throw new GraphQLError("you must be logged in to query this schema", {
    //   extensions: {
    //     code: 'UNAUTHENTICATED',
    //   },
    // });
    // if (true) throw new GraphQLError('You are not authorized to perform this action.', {
    //   extensions: {
    //     code: 'FORBIDDEN',
    //     argumentName: 'tokenID',
    //     alpha: 'beta'
    //   },
    // });
    // console.table(users)
    return users.map((user) => {
      return { ...user, password: "********" };
    });
  },

  getUserById: async (_, args) => {
    const user = await dataSourcesMongo.getUserById(args.id);
    return { ...user, password: "********" }
  },

  getCampaign: async(_, args) => {
    const campaign = await dataSourcesMongo.getCampaign(args.id);
    return campaign;
  },

  getCampaignAll: async(_, args) => {
    const campaignAll = await dataSourcesMongo.getCampaignAll(args.id);
    return campaignAll;
  },

  getUserByName: async (_, args) => {
    const user = await dataSourcesMongo.getUserByName(args.name);
    return { ...user, password: "********" }
  },

  getPollOption: async (_, args) => {
    const pollOption = await dataSourcesMongo.getPollOption(args.id);
    return pollOption;
  },

  getPoll: async (_, args) => {
    const poll = await dataSourcesMongo.getPoll(args.id);
    return poll;
  },

  getPollsForCampaign: async (_, args) => {
    const polls = await dataSourcesMongo.getPollsForCampaign(args.campaignId);
    return polls;
  },

  getPollOptionsForPoll: async (_, args) => {
    const pollOptions = await dataSourcesMongo.getPollOptionsForPoll(args.pollId);
    return pollOptions;
  },

  getUserByEmail: async (_, args, contextValue) => {
    console.log("contextValue: ", contextValue.token)
    // TODO: check permissions...
    const user = await dataSourcesMongo.getUserByEmail(args.email);
    return { ...user, password: "********" }
  },

  login: async (_, { email, password }): Promise<UserMutationResponse> => {
    let user = await dataSourcesMongo.getUserByEmail(email);
    const token = await jwtUtil.sign();

    if (user) {
      const match = await bcrypt.compare(password, user.password);  // REVIEW: password encrypté dans le client !!??
      if (match) {
        return {
          code: '200',
          success: true,
          message: "user successfully logged",
          token: token,
          user: { ...user, password: "********" }
        }
      } else {
        return {
          code: '200',
          success: false,
          message: "unknown combination email/passwword",
          token: null,
          user: null
        }
      }
    } else {
      return {
        code: '200',
        success: false,
        message: "unknown combination email/passwword",
        token: null,
        user: null
      }
    }
  },

  getVotesForCampaign: async (_, {campaignID, userID}) => {
    // console.log("getVotesForCampaign from client");
    return await dataSourcesRedis.getVotesForCampaign(campaignID, userID);
  },
  // getVotesForCampaign: async (_, args) => {
  //   console.log("getVotesForCampaign from client");
  //   console.log(args.userID)
  //   return await dataSourcesRedis.getVotesForCampaign(args.campaignID);
  // },
  
  getVotesForPoll: async (_, {pollID, userID}) => {
    // console.log("getVotesForPoll from client");
    return await dataSourcesRedis.getVotesForPoll(pollID, userID);
  },
  
  getVotesForPollOption: async (_, {pollOptionID, userID}) => {
    console.log("getVotesForPollOption from client");
    return await dataSourcesRedis.getVotesForPollOption(pollOptionID, userID);
  },
  
  getVotesForUser: async (_, args) => {
    console.log("getVotesForUser from client");
    return await dataSourcesRedis.getVotesForUser(args.userID);
  },

  getVoteById: async (_, args) => {
    return dataSourcesRedis.getVoteById(args.id);
  },
}

export default queries;
