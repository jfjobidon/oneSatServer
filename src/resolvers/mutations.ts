
import {
  User,
  AddVoteMutationResponse,
  MutationResolvers,
  VoteInput,
  UserMutationResponse,
  CampaignMutationResponse,
  CampaignInput,
  UserInput,
  PollInput,
  PollOptionInput,
  PollMutationResponse,
  PollOptionMutationResponse,
  FundingMutationResponse,
  PauseMutationResponse,
  FavoriteElementMutationResponse,
  FavoriteInput,
} from '../__generated__/resolvers-types'

import { CreateNewsEventInput } from '../__generated__/resolvers-types'
import { pubsub } from './pubsub.js'
import { DataSourcesRedis } from '../datasourcesredis.js'
const dataSourcesRedis = new DataSourcesRedis()
import { DataSourcesMongo } from '../datasourcesmongo.js'
const dataSourcesMongo = new DataSourcesMongo()
import { responseObject } from '../utils/types'
import randomstring from "randomstring"

// check addVote authorisation for user
//    vérifier multiple votes...
// modifier la campagne tant qu'elle n'est pas lancée ?
// ajouter un filtre pour les subscriptions aux votes
    // le filtre sera fait sur les campaignId
    // tout les events seront envoyés aux clients
    // chaque client pourra mettre toutes les infos de la campagne à jour
    // et pourra décider d'envoyer une alerte à l'usager (en fonction du pollId ou pollOptionId par exemple)
    // c'est le client qui alertera aussi si une pollOption change de position
    // add subscription poll, pollOption, campaign pour chaque voteur
      // subscription campaign seulement coté serveur
      // le client fait les test pour subsrciption campaigne, poll, pollOption, etc...
    // add subscription : how much sats you make --> NON: coté client
// script simulation votes pour une campaign
// produire rapport votes de la campagne
// add users from excel file
// (cron job): campaignReport(campaignId)
// admin: getStats([campaignId | userId | pollId | pollOptionId])
// ? campaign: add field: numberVotes ?
// createPoll: check if title is unique: same for campaign, pollOption...

const validateVote = async (voteInput: VoteInput): Promise<responseObject> => {
  // 1) check if voteInput is empty
  // 2) check if user has enough sats to vote
  // 3) check campaign parameters: min sat per vote
  // 4) check campaign parameters: max sat per vote
  // 5) check poll parameters: paused ?
  // 6) check campaign parameters: paused ?
  // 7) check campaign dates: has started
  // 8) check campaign dates: has ended
  // 9) TODO: check if double vote

  let response: responseObject = {
    code: 200,
    success: true,
    message: "vote is valid"
  }

  // 1) check if voteInput is empty
  const isEmpty: Boolean = Object.values(voteInput).some(x => x === null || x === '')
  if (isEmpty) {
    response.message = "vote is empty"
    console.log(response.message)
    response.success = false
    response.code = 400
  } else {
    // 2) check if enough sats
    let user = await dataSourcesMongo.getUserById(voteInput.uid)
    // TODO: FIXME: get sats from redis
    let userSats = 1111111
    let voteInputSats = voteInput.sats
    if (userSats < voteInputSats) {
      response.message = `You dont have enough sats to vote: you have ${userSats}, you need ${voteInput.sats}`
      console.log(response.message)
      response.success = false
      response.code = 400
    } else {
      // console.log("enough sats")
      let campaign = await dataSourcesMongo.getCampaign(voteInput.campaignId)
      console.table(campaign)
      // 3) check campaign parameters: min sat per vote
      if (voteInputSats < campaign.minSatPerVote) {
        response.message = `vote should be at least ${campaign.minSatPerVote} sats`
        console.log(response.message)
        response.success = false
        response.code = 400
      } else {
        // vote has >= minimum sats per vote
        // 4) check campaign parameters: max sat per vote
        if (voteInputSats > campaign.maxSatPerVote) {
          response.message = `vote should be at max ${campaign.maxSatPerVote} sats`
          console.log(response.message)
          response.success = false
          response.code = 400
        } else {
          // vote has <= maximum sats per vote
          // console.log("sats ok for campaign")
          // 5) check poll parameters: paused ?
          let poll = await dataSourcesMongo.getPoll(voteInput.pollId)
          if (poll.paused) {
            response.message = "Poll is Paused"
            console.log(response.message)
            response.success = false
            response.code = 400
          } else {
            // console.log("Campaign is NOT paused")
            // 6) check campaign parameters: paused ?
            if (campaign.paused) {
              response.message = "Campaign is Paused"
              console.log(response.message)
              response.success = false
              response.code = 400
            } else {
              // console.log("poll is NOT paused")
              // 7) check campaign dates: has started
              let startingDate = campaign.startingDate
              let endingDate = campaign.endingDate
              let currentDate = new Date()
              if (currentDate < startingDate) {
                response.message = "Campaign has not started yet"
                console.log(response.message)
                response.success = false
                response.code = 400
              } else {
                // 8) check campaign dates: has ended
                if (currentDate > endingDate) {
                  response.message = "Campaign has ended"
                  console.log(response.message)
                  response.success = false
                  response.code = 400
                } else {
                  console.log(response.message)
                }
              }
            }
          }
        }
      }
    }
  }
  // console.log(response.message)
  return response
}

// Use the generated `MutationResolvers` type to type check our mutations!
const mutations: MutationResolvers = {

  // createPoll: async (_, { pollInput }, context): Promise<PollMutationResponse> => {
    // signup: async (_, { userInput }): Promise<UserMutationResponse> => {
  favoriteElement: async (_, {favoriteInput}): Promise<FavoriteElementMutationResponse> => {
    // add/remove elementId in user.isfavorite
    console.log("favoriteElement: ", favoriteInput.uid, favoriteInput.elementId, favoriteInput.isFavorite)
    console.log("favoriteElement")
    const favoriteResponse = await dataSourcesMongo.favoriteElement({...favoriteInput})
    return favoriteResponse
    // return {
    //   code: favoriteResponse.code,
    //   success: favoriteResponse.success,
    //   message: favoriteResponse.message,
    //   isFavorite: favoriteResponse.isFavorite
    // }
    // return {
    //   code: "400",
    //   success: true,
    //   message: "ok",
    //   isFavorite: true
    // }
  },

  createNewsEvent: (_parent: any, args: CreateNewsEventInput) => {
    console.log('args:', args)
    pubsub.publish('EVENT_CREATED', { newsFeed: args })
    return args
  },

  signup: async (_, { userInput }): Promise<UserMutationResponse> => {
    console.log("mutation signup....")
    const userMutationResponse = await dataSourcesMongo.signup({...userInput})
    return {
      code: userMutationResponse.code,
      success: userMutationResponse.success,
      message: userMutationResponse.message,
      user: userMutationResponse.user
    }
  },

  accountFunding: async (_, { fundingInput }, context): Promise<FundingMutationResponse> => {
    console.log("account funding...")
    console.table(context)
    let af = await dataSourcesMongo.accountFunding(context.userId, fundingInput)
    console.log("accountFunding return: ", af)
    return af
  },

  createCampaign: async (_, { campaignInput }, context): Promise<CampaignMutationResponse> => {
    let campaign = await dataSourcesMongo.createCampaign(campaignInput)
    return {...campaign}
  },

  createPoll: async (_, { pollInput }, context): Promise<PollMutationResponse> => {
    console.log("create poll")
    console.log(context)
    // TODO: FIXME: enable context and get authorId from context.userId
    let pollMutationResponse = await dataSourcesMongo.createPoll(pollInput)
    // console.log("createPoll return: ", pollMutationResponse)
    return pollMutationResponse
  },

  createPollOption: async (_, { pollOptionInput }, context): Promise<PollOptionMutationResponse> => {
    console.log("create poll option")
    console.log(context)
    let pollOption = await dataSourcesMongo.createPollOption(context.userId, pollOptionInput)
    console.log("createPollOption return: ", pollOption)
    return pollOption
  },

  togglePausePoll: async (_, { pausePollInput }, context): Promise<PauseMutationResponse> => {
    console.log("toggle pause poll")
    console.log(context)
    let campaignStatus = await dataSourcesMongo.togglePausePoll(pausePollInput)
    console.log("togglePausePoll return: ", campaignStatus)
    return campaignStatus
  },

  togglePauseCampaign: async (_, { pauseCampaignInput }, context): Promise<PauseMutationResponse> => {
    console.log("toggle pause campaign")
    console.log(context)
    let campaignStatus = await dataSourcesMongo.togglePauseCampaign(pauseCampaignInput)
    console.log("togglePauseCampaign return: ", campaignStatus)
    return campaignStatus
  },

  // (campaignId: String!): pauseMutationResponse

  // TODO: transformer en ACID transaction
  // addVote: async (_, vote: VoteInput, { dataSources }): Promise<AddVoteMutationResponse>  => {
  addVote: async (_, { voteInput }): Promise<AddVoteMutationResponse> => {
    console.log("addVote async mutations...")
    // let responseObject = await validateVote(voteInput)
    let responseObject = {  // TODO: DEBUG: REVIEW: delete this object
      success: true,
      code: 200,
      message: "ok"
    }
    if (responseObject.success) {
      console.log("VOTE IS VALID")
      // possibility to filter publish: withFilter
      let voteResponse = await dataSourcesRedis.addVote(voteInput)
      // console.log("addVote voteResponse")
      // console.table(voteResponse)
      pubsub.publish('EVENT_VOTEADDED', { voteAdded: voteResponse.vote })
      return voteResponse
    } else {
      console.log("VOTE IS NOT VALID")
      console.log(responseObject.message)
      return {
        code: responseObject.code,
        success: false,
        message: responseObject.message,
        vote: null
      }
    }
  }
}

export default mutations