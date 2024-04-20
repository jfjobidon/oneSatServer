import config from "config";

// // for type safety in our data source class
// // import { objectEnumValues } from "@prisma/client/runtime/library";
import { User, UserInput, UserMutationResponse, CampaignMutationResponse, CampaignInput, CampaignAll, Poll, PollInput, PollMutationResponse, PollOptionMutationResponse, PollOption, PollOptionInput, PollAll, FundingInput, FundingMutationResponse, PauseMutationResponse  } from "./__generated__/resolvers-types";

// const UsersDB: Omit<Required<User>, "__typename">[] = usersData;

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

import { Campaign, Funding, PrismaClient } from '@prisma/client';
// import { describe } from "node:test";
// import { commandOptions } from "redis";
// import { clearScreenDown } from "readline";
const prisma = new PrismaClient();

export class DataSourcesMongo {

  async accountFunding(userId: string, fundingInput: FundingInput): Promise<FundingMutationResponse> {
    try {
      let amountSat = fundingInput.sats;
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
    console.table(users)
    return users;
  }

  async getUserByName(name: string): Promise<User> {
    console.log("in getUserByName")
    console.log(name)
    const user = prisma.user.findUnique({ where: { name: name } });
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    console.log("in getUserByEmail")
    console.log(email)
    const user = await prisma.user.findUnique({ where: { email: email } });
    console.log("date user: " + user.creationDate)
    return user;
    // return null;
  }

  async getPollOption(pollOptionID: string): Promise<PollOption> {
    console.log("in getPollOption");
    // const pollOption = await prisma.pollOption.findUnique({ where: { pollId: pollOptionID}});
    const pollOption = await prisma.pollOption.findUnique({ where: { id: pollOptionID}});
    // console.log(pollOption);
    return pollOption;
  }

  async getCampaign(campaignID: string): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({ where: {id: campaignID} });
    // console.table(campaign);
    return campaign;
  }

  async getCampaignAll(campaignID: string): Promise<CampaignAll> {
    const campaign: CampaignAll = await prisma.campaign.findUnique({ where: {id: campaignID} });
    // console.table(campaign);
    const polls = await this.getPollsAllForCampaign(campaignID);
    campaign.pollsAll = polls;
    return campaign;
  }

  async togglePausePoll(pausePollInput) : Promise<PauseMutationResponse> {
    const poll: Poll = await prisma.poll.findUnique({ where: {id: pausePollInput.pollID} });
    const updatePoll = await prisma.poll.update({
      where: {
        id: pausePollInput.pollID,
      },
      data: {
        paused: {
          set: !poll.paused
        },
      },
    })
    const campaign: Campaign = await prisma.campaign.findUnique({ where: {id: poll.campaignId} });

    const polls = await this.getPollsForCampaign(campaign.id);
    const pollsStatus: any = polls.map(poll => {
      return {
        pollID: poll.id,
        paused: poll.paused
      }
    });
    return {
      code: "404",
      success: true,
      message: "voila",
      campaignStatus: {
          campaignID: poll.campaignId,
          campaignPaused: campaign.paused,
          newItemID: pausePollInput.pollID,
          newItemPaused: !poll.paused,
          pollsStatus: pollsStatus
        }
    }
  }

  async togglePauseCampaign(pauseCampaignInput) : Promise<PauseMutationResponse> {
    const campaign: Campaign = await prisma.campaign.findUnique({ where: {id: pauseCampaignInput.campaignID} });
    const updateCampaign = await prisma.campaign.update({
      where: {
        id: pauseCampaignInput.campaignID
      },
      data: {
        paused: {
          set: !campaign.paused
        },
      },
    })

    const polls = await this.getPollsForCampaign(campaign.id);
    const pollsStatus: any = polls.map(poll => {
      return {
        pollID: poll.id,
        paused: poll.paused
      }
    });
    return {
      code: "404",
      success: true,
      message: "voila",
      campaignStatus: {
          campaignID: campaign.id,
          campaignPaused: !campaign.paused,
          newItemID: campaign.id,
          newItemPaused: !campaign.paused,
          pollsStatus: pollsStatus
        }
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    const poll = await prisma.poll.findUnique({ where: {id: pollID} });
    // console.table(poll);
    return poll;
  }

  async getPollsForCampaign(campaignID: string): Promise<Poll[]> {
    // const campaign = await prisma.campaign.findUnique({ where: {id: campaignID} });
    // return campaign.polls;
    // const polls = await prisma.poll.findMany({ where: {campaignId: campaignID}});
    const polls = await prisma.poll.findMany({ where: {campaignId: campaignID} });
    return polls;
  }

  async getPollsAllForCampaign(campaignID: string): Promise<PollAll[]> {
    // const campaign = await prisma.campaign.findUnique({ where: {id: campaignID} });
    // return campaign.polls;
    // const polls = await prisma.poll.findMany({ where: {campaignId: campaignID}});
    const pollsAll: PollAll[] = await prisma.poll.findMany({ where: {campaignId: campaignID} });
    // pollsAll.forEach(poll => {
    for (const pollAll of pollsAll) {
      // console.table(pollAll);
      // poll.pollOptions = await this.getPollOptionsForPoll(poll.id);
      const pollOptions = await this.getPollOptionsForPoll(pollAll.id);
      // console.table(pollOptions);
      pollAll.pollOptions = pollOptions;
      // const pollOptions = await this.getPollOptionsForPoll(pollAll.id);
    };
    return pollsAll;
  }

  async getPollOptionsForPoll(pollID: string): Promise<PollOption[]> {
    const pollOptions = await prisma.pollOption.findMany({ where: {pollId: pollID} });
    return pollOptions;
  }

  // async createCampaign(authorId: string, campaign: CampaignInput): Promise<CampaignMutationResponse> {
  async createCampaign(authorId: string, campaignInput: CampaignInput): Promise<CampaignMutationResponse> {
    console.table(campaignInput)
    const minSatPerVote = campaignInput.minSatPerVote || minSatPerVoteDefault;
    const maxSatPerVote = campaignInput.maxSatPerVote || maxSatPerVoteDefault;
    const suggestedSatPerVote = campaignInput.suggestedSatPerVote || suggestedSatPerVoteDefault;
    const blindAmount = campaignInput.blindAmount || blindAmountDefault;
    const blindRank = campaignInput.blindRank || blindRankDefault;
    const allowMultipleVotes = campaignInput.allowMultipleVotes || allowMultipleVotesDefault;
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
                  totalSats: 0,
                  creationDate: creationDate,
                  updatedDate: creationDate,
                  startingDate: startingDate,
                  endingDate: endingDate,
                  paused: campaignPausedDefault,
                  blindAmount: blindAmount,
                  blindRank: blindRank,
                  allowMultipleVotes: allowMultipleVotes
                }
              ],
              // data: [{...campaignInput, creationDate: Date()}],
              // data: [{...campaignInput}],
              // data: [{...campaignInput, creationDate: "2023-10-23T19:13:38.357+00:00"}],
              // data: [{...campaignInput, creationDate: new Date(isodate)}],
              // data: [{...campaignInput, creationDate: (new Date()).toISOString()}],
              // data: [{ title: 'My first post' }, { title: 'My second post' }],
            },
          },
        },
        include: {
          campaigns: true
        },
      })
      // console.table(result)
      // console.table(result.campaigns)
      return {
        code: "200",
        success: true,
        message: "Campaign created!",
        // campaign: result.campaigns[1]
        campaign: {
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
          totalSats: 0,
          paused: campaignPausedDefault,
          blindAmount: blindAmount,
          blindRank: blindRank,
          allowMultipleVotes: allowMultipleVotes,
          // creationDate: result.campaigns[1].creationDate
          creationDate: creationDate,
          updatedDate: creationDate
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
      console.log(err)
    }
  }

  async createPoll(authorId: String, pollInput: PollInput): Promise<PollMutationResponse> {
    const campaignId = pollInput.campaignId;

    // to get the new pollID, we must compare database before and after !!!
    const pollsBefore = await this.getPollsForCampaign(campaignId);

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
                  title: pollInput.title,
                  description: pollInput.description,
                  totalSats: 0,
                  paused: false
                }
              ]
            }
          }
        },
        include: {
          polls: true
        }
      })
      console.table(result);
      // iterate trough result.polls and extract new pollID
      const pollsAfter = await this.getPollsForCampaign(campaignId);
      // REVIEW: au lieu de includes check: pollBefore.id === pollAfter.id
      let result2 = pollsAfter.filter(pollAfter => pollsBefore.every(pollBefore => !pollBefore.id.includes(pollAfter.id)));

      return {
        code: "200",
        success: true,
        message: "poll created!",
        poll: {
          // authorId: authorId,
          id: result2[0].id,
          campaignId: campaignId,
          title: pollInput.title,
          description: pollInput.description,
          totalSats: 0,
          paused: false
        },
      }
    } catch (err) {
      console.log(err)
    }
  }

  // createPollOption(context.userid, pollOptionInput);
  async createPollOption(authorId: String, pollOptionInput: PollOptionInput): Promise<PollOptionMutationResponse> {
     const pollId = pollOptionInput.pollId;
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
          totalSats: 0
        }
      }
     } catch (err) {
      console.log(err)
     }
  }

  async getUserById(id: string): Promise<User> {
    console.log("in getUser")
    console.log(id)
    const user = prisma.user.findUnique({ where: { id: id } });
    // const user = prisma.user.findUnique({where: {id: "65df66779ebcb78f689a4803"}});
    // const user = prisma.user.findUnique({where: {name: id}});
    return user;
    // return null;
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

