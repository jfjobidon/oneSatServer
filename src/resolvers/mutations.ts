
import { User, AddUserMutationResponse, AddVoteMutationResponse, MutationResolvers, VoteInput, SignupMutationResponse, CampaignMutationResponse, CampaignInput } from '../__generated__/resolvers-types';

import { CreateNewsEventInput } from '../__generated__/resolvers-types';
import { pubsub } from './pubsub.js';
import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();
import { DataSourcesMongo } from '../datasourcesmongo.js';
const dataSourcesMongo = new DataSourcesMongo();
import bcrypt from "bcrypt";
const saltRounds = 10;
import { JwtUtil } from "../utils/jwt.js";
import { ChildProcess } from 'child_process';
const jwtUtil = new JwtUtil()

const validateVote = (vote: VoteInput): Boolean => {
  const isEmpty: Boolean = Object.values(vote).some(x => x === null || x === '');
  return isEmpty
}

// Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {

  createNewsEvent: (_parent: any, args: CreateNewsEventInput) => {
    console.log('args:', args);
    pubsub.publish('EVENT_CREATED', { newsFeed: args });
    return args;
  },

  // TODO: enlever cette fonction...
  // addUser: async (_, { name, email, password }: User): Promise<AddUserMutationResponse> => {
  //   console.log("mutation addUser....")
  //   return dataSourcesMongo.addUser({ name: name, email: email, password: password });
  // },

  // signup: async (_, { name, email, password }: User): Promise<SignupMutationResponse> => {
  signup: async (_, user: User): Promise<SignupMutationResponse> => {
    console.log("mutation signup....")
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(user.password, salt);
    const user2 = { ...user, password: hashPassword}
    // const userMutationResponse = await dataSourcesMongo.signup({ name: user.name, email: user.email, password: hashPassword });
    const userMutationResponse = await dataSourcesMongo.signup(user2);
    const token = await jwtUtil.sign();
    return {
      code: userMutationResponse.code,
      success: userMutationResponse.success,
      message: userMutationResponse.message,
      token: token,
      user: userMutationResponse.user
    }
    
    // REVIEW: refaire en sync
    // https://www.npmjs.com/package/bcrypt

    // bcrypt.genSalt(saltRounds, function(err, salt) {
    //   bcrypt.hash(password, salt, function(err, hashPassword) {
    //     dataSourcesMongo.signup({ name: name, email: email, password: hashPassword });
    //   });
    // });



    // bcrypt.hash(myPlaintextPassword, saltRounds).then(function(hash) {
    //   // Store hash in your password DB.
    // });
    // bcrypt.genSalt(saltRounds).then(
    //   salt => bcrypt.hash(password, salt).then(
        // hashPassword => dataSourcesMongo.signup({ name: name, email: email, password: hashPassword }).then(
        //   () => {
        //     return {
        //       token: "jfdkalflkja",
        //       user: {
        //         email: email,
        //         name: name,
        //         password: hashPassword
        //       }
        //     }
        //   }
        // )
        // hashPassword => ()
        //    return dataSourcesMongo.signup({ name: name, email: email, password: hashPassword })
        // }
    //   )
    // )

  },

  createCampaign: async (_, args, context): Promise<CampaignMutationResponse> => {
    console.log("create campaign")
    console.log(context)
    let c =  await dataSourcesMongo.createCampaign(context.userid, args.campaignInput);
    console.log("createCampaign return: ", c)
    return c
  },

  //   addVote: async (_, vote: VoteInput, { dataSources }): Promise<AddVoteMutationResponse>  => {
  addVote: async (_, vote: VoteInput): Promise<AddVoteMutationResponse> => {
    console.log("addVote async mutations...")
    if (validateVote(vote)) {
      return {
        code: "400",
        success: false,
        message: "Problem adding new vote!",
        vote: null
      }
    } else {
      // possibility to filter publish: withFilter
      pubsub.publish('EVENT_VOTEADDED', { voteAdded: vote });
      return await dataSourcesRedis.addVote(vote);
    }
  }
};

export default mutations;