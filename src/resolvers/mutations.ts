
import { User, AddVoteMutationResponse, MutationResolvers, VoteInput, UserMutationResponse, CampaignMutationResponse, CampaignInput, UserInput, PollInput, PollOptionInput, PollMutationResponse, PollOptionMutationResponse, FundingMutationResponse } from '../__generated__/resolvers-types';

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
const jwtUtil = new JwtUtil();
import { responseObject } from '../utils/types';

// TODO: un/pause campaign
//       un/pause poll
// cron job: campaign ended: send 50% sats to user
// check addVote for user
// modifier la campagne tant qu'elle n'est pas lancée ?
// ajouter un filtre pour les subscriptions aux votes
// script simulation votes pour une campaign
// vérifier multiple votes...
// produire rapport PDF votes de la campagne
// add subscription poll, pollOption, campaign pour chaque voteur
// add subscription : how much sats you make 

const validateVote = async (voteInput: VoteInput): Promise<responseObject> => {
  // 1) check if voteInput is empty
  // 2) check if user has enough sats to vote
  // 3) check campaign parameters: min sat per vote
  // 4) check campaign parameters: max sat per vote
  // 5) check poll parameters: paused ?
  // 6) check campaign parameters: paused ?
  // 7) check campaign dates: has started
  // 8) check campaign dates: has ended

  let response: responseObject = {
    code: 200,
    success: true,
    message: "vote is valid"
  }

  // 1) check if voteInput is empty
  const isEmpty: Boolean = Object.values(voteInput).some(x => x === null || x === '');
  if (isEmpty) {
    response.message = "vote is empty";
    console.log(response.message);
    response.success = false;
    response.code = 400;
  } else {
    // 2) check if enough sats
    let user = await dataSourcesMongo.getUserById(voteInput.userID);
    let userSats = user.sats;
    let voteInputSats = voteInput.sats
    if (userSats < voteInputSats) {
      response.message = `You dont have enough sats to vote: you have ${userSats}, you need ${voteInput.sats}`;
      console.log(response.message);
      response.success = false;
      response.code = 400;
    } else {
      // console.log("enough sats");
      let campaign = await dataSourcesMongo.getCampaignByID(voteInput.campaignID);
      console.table(campaign);
      // 3) check campaign parameters: min sat per vote
      if (voteInputSats < campaign.minSatPerVote) {
        response.message = `vote should be at least ${campaign.minSatPerVote} sats`;
        console.log(response.message);
        response.success = false;
        response.code = 400;
      } else {
        // vote has >= minimum sats per vote
        // 4) check campaign parameters: max sat per vote
        if (voteInputSats > campaign.maxSatPerVote) {
          response.message = `vote should be at max ${campaign.maxSatPerVote} sats`;
          console.log(response.message);
          response.success = false;
          response.code = 400;
        } else {
          // vote has <= maximum sats per vote
          // console.log("sats ok for campaign");
          // 5) check poll parameters: paused ?
          let poll = await dataSourcesMongo.getPoll(voteInput.pollID);
          if (poll.paused) {
            response.message = "Poll is Paused";
            console.log(response.message);
            response.success = false;
            response.code = 400;
          } else {
            // console.log("Campaign is NOT paused");
            // 6) check campaign parameters: paused ?
            if (campaign.paused) {
              response.message = "Campaign is Paused";
              console.log(response.message);
              response.success = false;
              response.code = 400;
            } else {
              // console.log("poll is NOT paused");
              // 7) check campaign dates: has started
              let startingDate = campaign.startingDate;
              let endingDate = campaign.endingDate;
              let currentDate = new Date();
              if (currentDate < startingDate) {
                response.message = "Campaign has not started yet"
                console.log(response.message);
                response.success = false;
                response.code = 400;
              } else {
                // 8) check campaign dates: has ended
                if (currentDate > endingDate) {
                  response.message = "Campaign has ended"
                  console.log(response.message);
                  response.success = false;
                  response.code = 400;
                } else {
                  console.log(response.message);
                }
              }
            }
          }
        }
      }
    }
  }
  // console.log(response.message);
  return response;
}

// Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {

  createNewsEvent: (_parent: any, args: CreateNewsEventInput) => {
    console.log('args:', args);
    pubsub.publish('EVENT_CREATED', { newsFeed: args });
    return args;
  },

  // signup: async (_, { name, email, password }: User): Promise<UserMutationResponse> => {
  // signup: async (_, user: User): Promise<UserMutationResponse> => {
  signup: async (_, { userInput }): Promise<UserMutationResponse> => {
    console.log("mutation signup....")
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(userInput.password, salt);
    const userMutationResponse = await dataSourcesMongo.signup({ ...userInput, password: hashPassword });
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

  accountFunding: async (_, { fundingInput }, context): Promise<FundingMutationResponse> => {
    console.log("account funding...")
    console.table(context)
    let af = await dataSourcesMongo.accountFunding(context.userid, fundingInput);
    console.log("accountFunding return: ", af);
    return af;
  },

  createCampaign: async (_, { campaignInput }, context): Promise<CampaignMutationResponse> => {
    console.log("create campaign")
    console.table(context)
    let c = await dataSourcesMongo.createCampaign(context.userid, campaignInput);
    console.log("createCampaign return: ", c)
    return c
  },

  createPoll: async (_, { pollInput }, context): Promise<PollMutationResponse> => {
    console.log("create poll")
    console.log(context)
    let p = await dataSourcesMongo.createPoll(context.userid, pollInput);
    console.log("createPoll return: ", p)
    return p
  },

  createPollOption: async (_, { pollOptionInput }, context): Promise<PollOptionMutationResponse> => {
    console.log("create poll option")
    console.log(context)
    let pollOption = await dataSourcesMongo.createPollOption(context.userid, pollOptionInput);
    console.log("createPollOption return: ", pollOption)
    return pollOption
  },

  // TODO: transformer en ACID transaction
  // addVote: async (_, vote: VoteInput, { dataSources }): Promise<AddVoteMutationResponse>  => {
  addVote: async (_, { voteInput }): Promise<AddVoteMutationResponse> => {
    console.log("addVote async mutations...")
    // let responseObject = await validateVote(voteInput);
    let responseObject = {  // DEBUG: REVIEW: delete this object
      success: true,
      code: 200,
      message: "ok"
    }
    if (responseObject.success) {
      console.log("VOTE IS VALID");
      // possibility to filter publish: withFilter
      pubsub.publish('EVENT_VOTEADDED', { voteAdded: voteInput });
      // 1) add vote in redis db
      return await dataSourcesRedis.addVote(voteInput);
      // 2) update totalSats in poll
      // 3) update totalSats in campaign
      // return {
      //   code: 200,
      //   success: true,
      //   message: "Vote added",
      //   vote: null
      // }
    } else {
      console.log("VOTE IS NOT VALID");
      console.log(responseObject.message)
      return {
        code: responseObject.code,
        success: false,
        message: responseObject.message,
        vote: null
      }
    }
  }
};

export default mutations;