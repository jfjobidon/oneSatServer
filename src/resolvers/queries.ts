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

import { networkInterfaces } from 'os';

const queries: QueryResolvers = {

  placeholder: async (_, __generated__) => {
    return true
  },

  ping: async (_, __) => {
    return { pong: "Pong"}
  },

  // for development, android needs the ip address of the server: localhost or 127.0.0.1 wont work
  getLocalIpAddress: async (_, __) => {
    // const { networkInterfaces } = require('os');

  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
          const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
          if (net.family === familyV4Value && !net.internal) {
              if (!results[name]) {
                  results[name] = [];
              }
              results[name].push(net.address);
          }
      }
    }
    console.log("result", results)
    return results.en0[0]
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
    //     argumentName: 'tokenId',
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
    if (user === null) {
      return null
    }
    return { ...user, password: "********" }
  },

  getCampaigns: async(_, args) => {
    const campaigns = await dataSourcesMongo.getCampaigns(args.id);
    return campaigns;
  },

  getCampaign: async(_, args) => {
    console.log("dans getCampaign...")
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

  // getVotesForCampaign: async (_, {campaignId, userId}) => {
  //   // console.log("getVotesForCampaign from client");
  //   return await dataSourcesRedis.getVotesForCampaign(campaignId, userId);
  // },
  // getVotesForCampaign: async (_, args) => {
  //   console.log("getVotesForCampaign from client");
  //   console.log(args.userId)
  //   return await dataSourcesRedis.getVotesForCampaign(args.campaignId);
  // },
  
  // REVIEW: nécessaire dans schema graphql ???
  getVotesForPoll: async (_, {pollId, userId}) => {
    // console.log("getVotesForPoll from client");
    return await dataSourcesRedis.getVotesForPoll(pollId, userId);
  },
  
  getVotesForPollOption: async (_, {pollOptionId, userId}) => {
    console.log("getVotesForPollOption from client");
    return await dataSourcesRedis.getVotesForPollOption(pollOptionId, userId);
  },
  
  getVotesForUser: async (_, args) => {
    console.log("getVotesForUser from client");
    return await dataSourcesRedis.getVotesForUser(args.userId);
  },

  getVoteById: async (_, args) => {
    return dataSourcesRedis.getVoteById(args.id);
  },
}

export default queries;
