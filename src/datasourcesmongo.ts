import config from "config"

// // for type safety in our data source class
// // import { objectEnumValues } from "@prisma/client/runtime/library"
import {
  User,
  UserInput,
  UserMutationResponse,
  Campaign,
  CampaignMutationResponse,
  CampaignInput,
  CampaignAll,
  Poll,
  PollInput,
  PollMutationResponse,
  PollOptionMutationResponse,
  PollOption,
  PollOptionInput,
  PollAll,
  FundingInput,
  FundingMutationResponse,
  PauseMutationResponse 
} from "./__generated__/resolvers-types"

// const UsersDB: Omit<Required<User>, "__typename">[] = usersData

const minSatPerVoteDefault = config.get<string>('minSatPerVoteDefault') 
const maxSatPerVoteDefault = config.get<string>('maxSatPerVoteDefault') 
const suggestedSatPerVoteDefault = config.get<string>('suggestedSatPerVoteDefault') 
const campaignPausedDefault = config.get<string>('campaignPausedDefault') 
const blindAmountDefault = config.get<string>('blindAmount') 
const blindRankDefault = config.get<string>('blindRank') 
const allowMultipleVotesDefault = config.get<string>('allowMultipleVotes') 
console.log("minSatPerVoteDefault " + minSatPerVoteDefault)
console.log("maxSatPerVoteDefault " + maxSatPerVoteDefault)
console.log("suggestedSatPerVoteDefault " + suggestedSatPerVoteDefault)
console.log("campaignPausedDefault " + campaignPausedDefault)
console.log("blindAmountDefault " + blindAmountDefault)
console.log("blindRankDefault " + blindRankDefault)
console.log("allowMultipleVotesDefault " + allowMultipleVotesDefault)

// NOTE: Campaing prisma !== Campaign graphQL
import { Campaign as CampaingMongo, Poll as PollMongo, PollOption as PollOptionMongo, PrismaClient } from '@prisma/client'
import { DataSourcesRedis } from "./datasourcesredis.js"
const dataSourcesRedis = new DataSourcesRedis()
// import { describe } from "node:test"
// import { commandOptions } from "redis"
// import { clearScreenDown } from "readline"
const prisma = new PrismaClient()

const pollsTest = [
  {
    id: "65f85cc473d0142ca49897df",
    campaignId: "65f85b91bbe053d8e26121fd",
    authorId: "65f85cc473d0142ca49897df",
    title: "title",
    description: "desc",
    paused: false,
    creationDate: Date(),
    startingDate: Date(),
    endingDate: Date(),
    minSatPerVote: 2,
    maxSatPerVote: 5,
    suggestedSatPerVote: 3,
    blindAmount: false,
    blindRank: false,
    allowMultipleVotes: false,
    pollOptions: [],
    sats: 23,
    votes: 34,
    views: 45
  }
]

export class DataSourcesMongo {

  async accountFunding(userId: string, fundingInput: FundingInput): Promise<FundingMutationResponse> {
    try {
      let amountSat = fundingInput.sats
      const result1 = await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          sats: {increment: amountSat}
        }
      })

      const result = await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          fundings: {
            createMany: {
              data: [
                {
                  invoice: fundingInput.invoice,
                  sats: fundingInput.sats,
                }
              ]
            }
          }
        },
        include: {
          fundings: true
        }
      })
      return {
        code: "200",
        success: true,
        message: "funding done",
        funding: {
          userId: userId,
          invoice: fundingInput.invoice,
          sats: fundingInput.sats,
          date: result.creationDate
        }
      }
    } catch(err) {
      console.log(err)
    }
  }

  async getUsers(): Promise<User[]> {
    // console.log("getUsers: prisma findMany")
    const users = await prisma.user.findMany({})
    // console.table(users)
    return users
  }

  async getUserByName(name: string): Promise<User> {
    console.log("in getUserByName")
    console.log(name)
    const user = prisma.user.findUnique({ where: { name: name } })
    return user
  }

  async getUserByEmail(email: string): Promise<User> {
    console.log("in getUserByEmail")
    console.log(email)
    const user = await prisma.user.findUnique({ where: { email: email } })
    console.log("date user: " + user.creationDate)
    return user
    // return null
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    try {
      const campaign: CampaingMongo = await prisma.campaign.findUnique({ where: {id: campaignId} })
      if (campaign === null) {
        return null
      } else {
        const sats = await dataSourcesRedis.getSatsForCampaign(campaignId)
        const nbVotes = await dataSourcesRedis.getNbVotesForCampaign(campaignId)
        const nbViews = await dataSourcesRedis.getNbViewsForCampaign(campaignId)
        return {...campaign, sats: sats, votes: nbVotes, views: nbViews}
      }
    }
    catch(error) {
      console.log(error)  // TODO: logError(error)
      return null
    }
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    console.log("userId", userId)

    try {
      const campaignsMongo: CampaingMongo[] = await prisma.campaign.findMany({ where: {authorId: userId} })
      if (campaignsMongo === null) {
        return null
      } else {
        let campaigns: Campaign[] = []

        for (const campaign of campaignsMongo) {
          // console.table(campaign)
          // console.log("paused", campaign.paused)
          const sats = await dataSourcesRedis.getSatsForCampaign(campaign.id)
          const votes = await dataSourcesRedis.getNbVotesForCampaign(campaign.id)
          const views = await dataSourcesRedis.getNbViewsForCampaign(campaign.id)
          campaigns.push({...campaign, sats, votes, views})
        }
        return campaigns
      }
    }
    catch(error) {
      console.log(error)  // TODO: logError(error)
      return null
    }
    // console.table(campaignsMongo)

    
  }

  async getCampaignAll(campaignId: string): Promise<CampaignAll> {
    try {
      const campaign: CampaingMongo = await prisma.campaign.findUnique({ where: {id: campaignId} })
      if (campaign === null) {
        return null
      } else {
        const polls = await this.getPollsAllForCampaign(campaignId)
        console.log("polls")
        console.table(polls)
        // const polls = []
        const sats = await dataSourcesRedis.getSatsForCampaign(campaignId)
        const votes = await dataSourcesRedis.getNbVotesForCampaign(campaignId)
        const views = await dataSourcesRedis.getNbViewsForCampaign(campaignId)
        return {...campaign, pollsAll: polls, sats: sats, votes, views}
      }
    }
    catch(error) {
      console.log(error)  // TODO: logError(error)
      return null
    }
  }

  async togglePausePoll(pausePollInput) : Promise<PauseMutationResponse> {
    const poll: PollMongo = await prisma.poll.findUnique({ where: {id: pausePollInput.pollId} })
    const updatePoll = await prisma.poll.update({
      where: {
        id: pausePollInput.pollId,
      },
      data: {
        paused: {
          set: !poll.paused
        },
      },
    })
    const campaign: CampaingMongo = await prisma.campaign.findUnique({ where: {id: poll.campaignId} })

    const polls = await this.getPollsForCampaign(campaign.id)
    const pollsStatus: any = polls.map(poll => {
      return {
        pollId: poll.id,
        paused: poll.paused
      }
    })
    return {
      code: "404",
      success: true,
      message: "voila",
      campaignStatus: {
          campaignId: poll.campaignId,
          campaignPaused: campaign.paused,
          newItemId: pausePollInput.pollId,
          newItemPaused: !poll.paused,
          pollsStatus: pollsStatus
        }
    }
  }

  async togglePauseCampaign(pauseCampaignInput) : Promise<PauseMutationResponse> {
    const campaign: CampaingMongo = await prisma.campaign.findUnique({ where: {id: pauseCampaignInput.campaignId} })
    const updateCampaign = await prisma.campaign.update({
      where: {
        id: pauseCampaignInput.campaignId
      },
      data: {
        paused: {
          set: !campaign.paused
        },
      },
    })

    const polls = await this.getPollsForCampaign(campaign.id)
    const pollsStatus: any = polls.map(poll => {
      return {
        pollId: poll.id,
        paused: poll.paused
      }
    })
    return {
      code: "404",
      success: true,
      message: "voila",
      campaignStatus: {
          campaignId: campaign.id,
          campaignPaused: !campaign.paused,
          newItemId: campaign.id,
          newItemPaused: !campaign.paused,
          pollsStatus: pollsStatus
        }
    }
  }

  async getPoll(pollId: string): Promise<Poll> {
    const poll: PollMongo = await prisma.poll.findUnique({ where: {id: pollId} })
    const sats = await dataSourcesRedis.getSatsForPoll(pollId)
    const nbVotes = await dataSourcesRedis.getNbVotesForPoll(pollId)
    const nbViews = await dataSourcesRedis.getNbViewsForPoll(pollId)
    // console.table(poll)
    return {...poll, sats: sats, votes: nbVotes, views: nbViews}
  }

  async getPollsForCampaign(campaignId: string): Promise<Poll[]> {
    // const campaign = await prisma.campaign.findUnique({ where: {id: campaignId} })
    // return campaign.polls
    // const polls = await prisma.poll.findMany({ where: {campaignId: campaignId}})
    const pollsMongo: PollMongo[] = await prisma.poll.findMany({ where: {campaignId: campaignId} })

    if (pollsMongo === null) {
      return []
    } else {
      let polls: Poll[] = []

      for (const poll of pollsMongo) {
        // console.table(poll)
        // console.log("paused", poll.paused)
        const sats = await dataSourcesRedis.getSatsForPoll(poll.id)
        const votes = await dataSourcesRedis.getNbVotesForPoll(poll.id)
        const views = await dataSourcesRedis.getNbViewsForPoll(poll.id)
        polls.push({...poll, sats, votes, views})
      }
      return polls
    }
  }

  async getPollsAllForCampaign(campaignId: string): Promise<PollAll[]> {
    let pollsAllMongo: PollMongo[] = await prisma.poll.findMany({ where: {campaignId: campaignId} })
    console.log("polslallmongo")
    console.table(pollsAllMongo)
    let pollsAll: PollAll[] = []
    // pollsAllMongo.forEach(async poll => {
      for (const pollAll of pollsAllMongo) {
        console.log("pollAll")
        console.table(pollAll)
        // const pollOptions = await this.getPollOptionsForPoll(pollAll.id)
        const pollOptions = []
        // console.log("pollOptions", pollOptions)
        const sats = await dataSourcesRedis.getSatsForPoll(pollAll.id)
        const votes = await dataSourcesRedis.getNbVotesForPoll(pollAll.id)
        // console.log("getNbVotesForPoll", votes)
        const views = await dataSourcesRedis.getNbViewsForPoll(pollAll.id)
        console.log("getNbViewsForPoll", views)
        pollsAll.push({...pollAll, sats, votes, views, pollOptions})
      }
    // })
    console.log("res pollsAll")
    console.table(pollsAll)
    return pollsAll
  }

  async getPollOption(pollOptionId: string): Promise<PollOption> {
    console.log("in getPollOption")
    // const pollOption = await prisma.pollOption.findUnique({ where: { pollId: pollOptionId}})
    const pollOption: PollOptionMongo = await prisma.pollOption.findUnique({ where: { id: pollOptionId}})
    // console.log(pollOption)
    const sats = await dataSourcesRedis.getSatsForPollOption(pollOptionId)
    const nbVotes = await dataSourcesRedis.getNbVotesForPollOption(pollOptionId)
    const nbViews = await dataSourcesRedis.getNbViewsForPollOption(pollOptionId)
    return {...pollOption, sats: sats, votes: nbVotes, views: nbViews}
  }

  async getPollOptionsForPoll(pollId: string): Promise<PollOption[]> {
    const pollOptionsMongo: PollOptionMongo[] = await prisma.pollOption.findMany({ where: {pollId: pollId} })

    // return pollOptions
    if (pollOptionsMongo === null) {
      return []
    } else {
      let pollOptions: PollOption[] = []

      for (const pollOption of pollOptionsMongo) {
        // console.table(pollOption)
        // console.log("paused", pollOption.paused)
        const sats = await dataSourcesRedis.getSatsForPollOption(pollOption.id)
        const votes = await dataSourcesRedis.getNbVotesForPollOption(pollOption.id)
        const views = await dataSourcesRedis.getNbViewsForPollOption(pollOption.id)
        pollOptions.push({...pollOption, sats, votes, views})
      }
      return pollOptions
    }
  }

  // async createCampaign(authorId: string, campaign: CampaignInput): Promise<CampaignMutationResponse> {
  async createCampaign(authorId: string, campaignInput: CampaignInput): Promise<CampaignMutationResponse> {
    console.log("authorId", authorId)
    console.table(campaignInput)
    const minSatPerVote = campaignInput.minSatPerVote || minSatPerVoteDefault
    const maxSatPerVote = campaignInput.maxSatPerVote || maxSatPerVoteDefault
    const suggestedSatPerVote = campaignInput.suggestedSatPerVote || suggestedSatPerVoteDefault
    const blindAmount = campaignInput.blindAmount || blindAmountDefault
    const blindRank = campaignInput.blindRank || blindRankDefault
    const allowMultipleVotes = campaignInput.allowMultipleVotes || allowMultipleVotesDefault
    const creationDate = new Date()
    const startingDate = new Date(campaignInput.startingDate)
    const endingDate = new Date(campaignInput.endingDate)
    console.log("startingDate: " + startingDate)
    console.log("creationDate: " + creationDate)
    
    if (creationDate > startingDate) {
      console.log("creationDate NOT OK")
      // throw new Error("Creation Date cannot be in the past") // REVIEW: graphql: INTERNAL_SERVER_ERROR
    }

    if (startingDate > endingDate) {
      console.log("Ending Date MUST be later than Starting Date")
      // throw new Error("Creation Date cannot be in the past") // REVIEW: graphql: INTERNAL_SERVER_ERROR
    }

    try {
      const result = await prisma.user.update({
        where: {
          id: authorId,
        },
        data: {
          campaigns: {
            // create: campaignInput
            // create: { ...campaignInput, creationDate: isodate },
            // create: { ...campaignInput, creationDate: Date() },
            createMany: {
              data: [
                {
                  ...campaignInput,
                  minSatPerVote: minSatPerVote,
                  maxSatPerVote: maxSatPerVote,
                  suggestedSatPerVote: suggestedSatPerVote,
                  creationDate: creationDate,
                  updatedDate: creationDate,
                  startingDate: startingDate,
                  endingDate: endingDate,
                  paused: campaignPausedDefault,
                  blindAmount: blindAmount,
                  blindRank: blindRank,
                  allowMultipleVotes: allowMultipleVotes
                }
              ]
            }
          }
        },
        include: {
          campaigns: true
        },
      })
      console.log("result")
      console.table(result)
      console.log("result.campaigns")
      console.table(result.campaigns)
      return {
        code: "200",
        success: true,
        message: "Campaign created!",
        campaign: {
          id: result.campaigns[0].id,
          authorId: authorId,
          title: campaignInput.title,
          question: campaignInput.question,
          description: campaignInput.description,
          startingDate: startingDate,
          endingDate: endingDate,
          message: null,
          minSatPerVote: minSatPerVote,
          maxSatPerVote: maxSatPerVote,
          suggestedSatPerVote: suggestedSatPerVote,
          paused: campaignPausedDefault,
          blindAmount: blindAmount,
          blindRank: blindRank,
          allowMultipleVotes: allowMultipleVotes,
          // creationDate: result.campaigns[1].creationDate
          creationDate: creationDate,
          updatedDate: creationDate,
          sats: 0,
          votes: 0,
          views: 0
        },
      }
      // const result = await prisma.user.update({
      //   where: {
      //     id: authorId,
      //   },
      //   data: {
      //     campaigns: {
      //       createMany: {
      //         data: [{...campaignInput, creationDate: new Date} ],
      //       },
      //     },
      //   },
      //   include: {
      //     campaigns: true,
      //   }
      // })
      // console.log(result)
      // return {
      //   code: "200",
      //   success: true,
      //   message: "Campaign created!",
      //   campaign: {
      //     title: campaignInput.title,
      //     authorId: authorId,
      //     // creationDate: result.campaigns[1].creationDate
      //     creationDate: new Date()
      //   },
      // }
    } catch (err) {
      console.log("err", err)
    }
  }

  async createPoll(userId: string, pollInput: PollInput): Promise<PollMutationResponse> {
    const campaignId = pollInput.campaignId
    const authorId = pollInput.authorId
    const minSatPerVote = pollInput.minSatPerVote || minSatPerVoteDefault
    const maxSatPerVote = pollInput.maxSatPerVote || maxSatPerVoteDefault
    const suggestedSatPerVote = pollInput.suggestedSatPerVote || suggestedSatPerVoteDefault
    const blindAmount = pollInput.blindAmount || blindAmountDefault
    const blindRank = pollInput.blindRank || blindRankDefault
    const allowMultipleVotes = pollInput.allowMultipleVotes || allowMultipleVotesDefault
    const creationDate = new Date()
    const startingDate = new Date(pollInput.startingDate)
    const endingDate = new Date(pollInput.endingDate)

    // to get the new pollId, we must compare poll database before and after !!!
    console.log("campaignId", campaignId)
    const pollsBefore = await this.getPollsForCampaign(campaignId)
    console.log("pollsBefore", pollsBefore)
    console.table(pollsBefore)

    try {
      const result = await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          polls: {
            createMany: {
              data: [
                {
                  // TODO:
                  // authorId: authorId.toString(),
                  // authorId: "66c4b26f8d94b6da2b1fa18d",
                  authorId: authorId,
                  title: pollInput.title,
                  description: pollInput.description,
                  paused: false,
                  creationDate: creationDate,
                  startingDate: startingDate,
                  endingDate: endingDate,
                  updatedDate: creationDate,
                  minSatPerVote: minSatPerVote,
                  maxSatPerVote: maxSatPerVote,
                  suggestedSatPerVote: suggestedSatPerVote,
                  blindAmount: blindAmount,
                  blindRank: blindRank,
                  allowMultipleVotes: allowMultipleVotes
                }
              ]
            }
          }
        },
        include: {
          polls: true
        }
      })
      // extracting new pollId
      const pollsAfter = await this.getPollsForCampaign(campaignId)
      let newPollArray = pollsAfter.filter(pollAfter => pollsBefore.every(pollBefore => !(pollBefore.id === pollAfter.id)))
      const newPollId = newPollArray[0].id

      return {
        code: "200",
        success: true,
        message: "poll created!",
        poll: {
          id: newPollId,
          campaignId: campaignId,
          authorId: authorId,
          title: pollInput.title,
          description: pollInput.description,
          paused: false,
          creationDate: creationDate,
          startingDate: startingDate,
          endingDate: endingDate,
          minSatPerVote: minSatPerVote,
          maxSatPerVote: maxSatPerVote,
          suggestedSatPerVote: suggestedSatPerVote,
          allowMultipleVotes: allowMultipleVotes,
          blindAmount: blindAmount,
          blindRank: blindRank,
          pollOptions: [],
          sats: 0,
          views: 0,
          votes: 0
        },
      }
    } catch (err) {
      console.log("mongo err", err)
    }
  }

  // createPollOption(context.userId, pollOptionInput)
  async createPollOption(authorId: String, pollOptionInput: PollOptionInput): Promise<PollOptionMutationResponse> {
     const pollId = pollOptionInput.pollId
     try {
      const result = await prisma.poll.update({
        where: {
          id: pollId
        },
        data: {
          pollOptions: {
            createMany: {
              data: [
                {
                  title: pollOptionInput.title,
                  description: pollOptionInput.description
                }
              ]
            }
          }
        },
        include: {
          pollOptions: true
        }
      })
      return {
        code: "200",
        success: true,
        message: "poll option created",
        pollOption: {
          pollId: pollId,
          title: pollOptionInput.title,
          description: pollOptionInput.description,
          sats: 0,
          votes: 0,
          views: 0
        }
      }
     } catch (err) {
      console.log(err)
     }
  }

  async getUserById(id: string): Promise<null | User> {
    let user
    try {
      user = await prisma.user.findUnique({ where: { id: id } })
      if (user === null) {
        return null
      }
    }
    catch(error) {
      console.log("error user", error)
      return null
    }
    // const user = prisma.user.findUnique({where: {id: "65df66779ebcb78f689a4803"}})
    // const user = prisma.user.findUnique({where: {name: id}})
    console.table(user)
    // TODO: create a function that returns the campaigns with sats, views and votes
    const campaigns: CampaingMongo[] = await prisma.campaign.findMany({ where: {authorId: id} })
    // const theCampaigns: Campaign[] = campaigns.map(camp => {
    //   // const satsCampaign2 = await dataSourcesRedis.getVotesForCampaign(camp.id, null)
    //   // const satsCampaign2 = dataSourcesRedis.getSatsForCampaign(camp.id)
    //   const satsCampaign = 456
    //   return {...camp, sats: satsCampaign, votes: 33, views: 44}  // TODO:
    // })

    let campaignsStats: Campaign[] = []
    for (const campaign of campaigns) {
      console.log(campaign.id)
      // const sats = await dataSourcesRedis.getSatsForCampaign(campaign.id)
      let sats = 0
      try {
        console.log("getSatsForCampaign", campaign.id)
        sats = await dataSourcesRedis.getSatsForCampaign(campaign.id)
      }
      catch(error) {
        console.log(error)
      }
      // DEBUG: error si le champ n'existe pas DEBUG:
      // console.table(pollOptions)
      campaignsStats.push({...campaign, sats: <number>sats})
      // const pollOptions = await this.getPollOptionsForPoll(pollAll.id)
    }

    // for (var i = 0 i < campaigns.length i++) {
    //   campaigns[i] = {...campaigns[i], sats: 1, votes: 2, views: 3}
    // }

    // fruits.forEach(function(fruit) {
    //   console.log(fruit)
    // }) 

    // for (var fruit of fruits) {
    //   console.log(fruit)
    // }

    // console.table(campaigns)
    return {...user, campaigns: campaignsStats}
    // return null
  }

  async signup(userInput: UserInput, userCode: string): Promise<UserMutationResponse> {
    try {
      let userResponse = await prisma.user.create({
        data: {
          ...userInput,
          userCode: userCode
        }
      })
      return {
        code: "200",
        success: true,
        message: "New user created!",
        user: { ...userResponse, password: "********" },
      }
    } catch (err) {
      console.log(err)
    }
  }

}

