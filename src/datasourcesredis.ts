import { createClient } from 'redis'
import { Repository, EntityId, EntityKeyName, Entity } from 'redis-om'
const redisClient = createClient({
  // host: 'localhost',
  // port: 6379,
  password: 'rRTGwNDL7a'
})
redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect();
const aString = await redisClient.ping();
console.log('redis PING: ', aString);
const osovID = "859058920934" // TODO: put that in config file

import randomstring from "randomstring";

import { Vote, VoteInput, AddVoteMutationResponse, GetVotesQueryResponse } from "./__generated__/resolvers-types";
// import { voteSchema } from './schema.redis.js';
import { voteSchema, satsPollOptionSchema, votesPollOptionSchema, viewsPollOptionSchema, satsPollSchema, votesPollSchema, viewsPollSchema, satsCampaignSchema, votesCampaignSchema, viewsCampaignSchema, satsUserSchema } from './schema.redis.js';

let voteRepository = new Repository(voteSchema, redisClient);
// await voteRepository.dropIndex();
await voteRepository.createIndex();  // required to use search (RediSearch)

let satsPollOptionRepository = new Repository(satsPollOptionSchema, redisClient);
await satsPollOptionRepository.createIndex();

let votesPollOptionRepository = new Repository(votesPollOptionSchema, redisClient);
await votesPollOptionRepository.createIndex();

let viewsPollOptionRepository = new Repository(viewsPollOptionSchema, redisClient);
await viewsPollOptionRepository.createIndex();

let satsPollRepository = new Repository(satsPollSchema, redisClient);
await satsPollRepository.createIndex();

let votesPollRepository = new Repository(votesPollSchema, redisClient);
await votesPollRepository.createIndex();

let viewsPollRepository = new Repository(viewsPollSchema, redisClient);
await viewsPollRepository.createIndex();

let satsCampaignRepository = new Repository(satsCampaignSchema, redisClient);
await satsCampaignRepository.createIndex();

let votesCampaignRepository = new Repository(votesCampaignSchema, redisClient);
await votesCampaignRepository.createIndex();

let viewsCampaignRepository = new Repository(viewsCampaignSchema, redisClient);
await viewsCampaignRepository.createIndex();

let satsUserRepository = new Repository(satsUserSchema, redisClient);
await satsUserRepository.createIndex();

//   userID: String!
//   invoice: String!
//   sats: Int!
//   campaignID: String!
//   pollID: String!
//   pollOptionID: String!
//   certified: Boolean!

export class DataSourcesRedis {
  // async addVote(userID: string, invoice: string, date: number, campaignID: string, certified: boolean) {
  // async addVote({ userID, invoice, date, campaignID, pollID, certified }: Vote): Promise<AddVoteMutationResponse> {
  async addVote(voteInput: VoteInput): Promise<AddVoteMutationResponse> {
    // TODO: tester createAndSave
    const voteCode = randomstring.generate(12); // REVIEW: nanoID ???
    console.log(voteCode);
    const currentDate = new Date;
    const vote: Entity = await voteRepository.save({ ...voteInput, voteCode: voteCode, date: currentDate.toString() });
    console.table(vote);
    console.log('entityId: ', vote[EntityId])
    console.log('entityKeyName: ', vote[EntityKeyName])
    // const exists = await redisClient.exists(`vote:${vote[EntityId]}`)
    const exists = await redisClient.exists(vote[EntityKeyName])
    if (exists) {
      // REVIEW: quoi faire si return false ???
      // await this.incrPollOption(voteInput.pollOptionID, voteInput.sats);
      // await this.incrPoll(voteInput.pollID, voteInput.sats);
      await this.incrCampaign(voteInput.campaignID, voteInput.userID, voteInput.sats);
      // await this.incrUser(voteInput.userID, voteInput.sats);
      return {
        code: 200,
        success: true,
        message: "New vote added!",
        vote: Object(vote), // vote is of type Symbol
      }
    } else {
      return {
        code: 400,
        success: false,
        message: "Problem adding new vote!",
        vote: null
      }
    }
  }

  async incrPollOption(pollOptionID: string, sats: number): Promise<Boolean> {
    try {
      // increments sats for PollOption
      console.log("pollOptionID", pollOptionID);
      const satsPollOption: Entity[] = await satsPollOptionRepository.search().where('pollOptionID').equals(pollOptionID).return.all();
      console.log(satsPollOption);
      if (satsPollOption.length == 0) {
        console.log("satsPollOption empty");
        const pollOption2: Entity = await satsPollOptionRepository.save({ "pollOptionID": pollOptionID, totalSats: sats });
        console.log(pollOption2);
      } else {
        satsPollOption[0].totalSats = (sats + parseInt(satsPollOption[0].totalSats.toString()));
        satsPollOptionRepository.save(satsPollOption[0]);
      }
      // increments votes for PollOption
      const votesPollOption: Entity[] = await votesPollOptionRepository.search().where('pollOptionID').equals(pollOptionID).return.all();
      console.log(votesPollOption);
      if (votesPollOption.length == 0) {
        console.log("votesPollOption empty");
        const votesPollOption2: Entity = await votesPollOptionRepository.save({ "pollOptionID": pollOptionID, totalVotes: 1 });
        console.log(votesPollOption2);
      } else {
        votesPollOption[0].totalVotes = (1 + parseInt(votesPollOption[0].totalVotes.toString()));
        votesPollOptionRepository.save(votesPollOption[0]);
      }
      // TODO: remove this: just for debugging now
      // increments views for PollOption
      // REVIEW: remplacer par INCRBY pollOptionID 1
      const viewsPollOption: Entity[] = await viewsPollOptionRepository.search().where('pollOptionID').equals(pollOptionID).return.all();
      console.log("viewsPollOption", viewsPollOption);
      if (viewsPollOption.length == 0) {
        console.log("viewsPollOption empty");
        const viewsPollOption2: Entity = await viewsPollOptionRepository.save({ "pollOptionID": pollOptionID, totalViews: 1 });
        console.log(viewsPollOption2);
      } else {
        viewsPollOption[0].totalViews = (1 + parseInt(viewsPollOption[0].totalViews.toString()));
        viewsPollOptionRepository.save(viewsPollOption[0]);
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true;
  }
    // REVIEW: other way to do it:
    // let pollOption0 = pollOption2[0]
    // let entityID = pollOption0[EntityId];
    // const pollop = await satsPollOptionRepository.fetch(entityID);
    // pollop.totalSats = (sats + parseInt(pollop.totalSats.toString()));
    // satsPollOptionRepository.save(pollop);

  async incrPoll(pollID: string, sats: number): Promise<Boolean> {
    try {
      console.log(pollID);
      // increment sat for Poll
      const satsPoll: Entity[] = await satsPollRepository.search().where('pollID').equals(pollID).return.all();
      console.log(satsPoll);
      if (satsPoll.length == 0) {
        console.log("poll empty");
        const poll2: Entity = await satsPollRepository.save({ "pollID": pollID, totalSats: sats });
        console.log(poll2);
      } else {
        satsPoll[0].totalSats = (sats + parseInt(satsPoll[0].totalSats.toString()));
        satsPollRepository.save(satsPoll[0]);
      }

      // increment votes for Poll
      const votesPoll: Entity[] = await votesPollRepository.search().where('pollID').equals(pollID).return.all();
      console.log(votesPoll);
      if (votesPoll.length == 0) {
        console.log("poll empty");
        const votesPoll2: Entity = await votesPollRepository.save({ "pollID": pollID, totalVotes: 1 });
        console.log(votesPoll2);
      } else {
        votesPoll[0].totalVotes = (1 + parseInt(votesPoll[0].totalVotes.toString()));
        votesPollRepository.save(votesPoll[0]);
      }

      // increments views for Poll
      const viewsPoll: Entity[] = await viewsPollRepository.search().where('pollID').equals(pollID).return.all();
      console.log("viewsPoll", viewsPoll);
      if (viewsPoll.length == 0) {
        console.log("viewsPoll empty");
        const viewsPoll2: Entity = await viewsPollRepository.save({ "pollID": pollID, totalViews: 1 });
        console.log(viewsPoll2);
      } else {
        viewsPoll[0].totalViews = (1 + parseInt(viewsPoll[0].totalViews.toString()));
        viewsPollRepository.save(viewsPoll[0]);
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true;
  }

  async getSatsForCampaign(campaignID: string): Promise<number> {
    const satCampaign: Entity[] = await satsCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
    let sats: number = 0
    if (satCampaign.length == 0) {
      sats = 0
    } else {
      sats = parseInt((satCampaign[0].totalSats).toString())
    }
    return sats
  }

  async getNbVotesForCampaign(campaignID: string): Promise<number> {
    const voteCampaign: Entity[] = await votesCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
    let nbVotes: number
    if (voteCampaign.length == 0) {
      nbVotes = 0
    } else {
      nbVotes = parseInt((voteCampaign[0].totalVotes).toString())
    }
    return nbVotes
  }

  async getNbViewsForCampaign(campaignID: string): Promise<number> {
    const viewsCampaign: Entity[] = await viewsCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
    let nbViews: number
    if (viewsCampaign.length == 0) {
      nbViews = 0
    } else {
      nbViews = parseInt((viewsCampaign[0].totalViews).toString())
    }
    return nbViews
  }

  async incrCampaign(campaignID: string, userID: string, sats: number): Promise<Boolean> {
    try {
      console.log(campaignID);
      // increments sats for Campaign
      const satsCampaign: Entity[] = await satsCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
      console.log(satsCampaign);
      let satsUser: number  // sats won by user
      let satsOSOV: number  // sat won by me
      if (satsCampaign.length == 0) {
        console.log("campaign empty");
        // compute the gain of the user and osov
        satsUser = Math.floor(sats / 2) + 1
        satsOSOV = sats - satsUser
        this.incrUser(userID, satsUser)
        this.incrUser(osovID, satsOSOV)
        const campaign2: Entity = await satsCampaignRepository.save({ "campaignID": campaignID, totalSats: sats });
        console.log(campaign2);
      } else {
        // before
        let beforeSatsCampaign = parseInt(satsCampaign[0].totalSats.toString())
        const beforeSatsUser = Math.floor(beforeSatsCampaign / 2) + 1
        const beforeSatsOSOV = beforeSatsCampaign - beforeSatsUser
        // after
        // compute the gain of the user and osov
        const afterSatsCampaign = beforeSatsCampaign + sats
        const afterSatsUser = Math.floor(afterSatsCampaign / 2) + 1
        const afterSatsOSOV = afterSatsCampaign - afterSatsUser
        this.incrUser(userID, afterSatsUser - beforeSatsUser)
        this.incrUser(osovID, afterSatsOSOV - beforeSatsOSOV)

        satsCampaign[0].totalSats = (sats + beforeSatsCampaign);
        satsCampaignRepository.save(satsCampaign[0]);
      }

      // increments votes for Campaign
      const votesCampaign: Entity[] = await votesCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
      console.log(votesCampaign);
      if (votesCampaign.length == 0) {
        console.log("campaign empty");
        const votesCampaign2: Entity = await votesCampaignRepository.save({ "campaignID": campaignID, totalVotes: 1 });
        console.log(votesCampaign2);
      } else {
        votesCampaign[0].totalVotes = (1 + parseInt(votesCampaign[0].totalVotes.toString()));
        votesCampaignRepository.save(votesCampaign[0]);
      }

      // increments views for Campaign
      const viewsCampaign: Entity[] = await viewsCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
      console.log("viewsCampaign", viewsCampaign);
      if (viewsCampaign.length == 0) {
        console.log("viewsCampaign empty");
        const viewsCampaign2: Entity = await viewsCampaignRepository.save({ "campaignID": campaignID, totalViews: 1 });
        console.log(viewsCampaign2);
      } else {
        viewsCampaign[0].totalViews = (1 + parseInt(viewsCampaign[0].totalViews.toString()));
        viewsCampaignRepository.save(viewsCampaign[0]);
      }

    } catch (err) {
      console.error(err);
    }
    return true;
  }

  // Documentation....
  async incrUser(userID: string, sats: number): Promise<Boolean> {
    try {
      console.log(userID)
      // increments sats for User
      const satsUser: Entity[] = await satsUserRepository.search().where('userID').equals(userID).return.all();
      console.log(satsUser);
      if (satsUser.length == 0) {
        console.log("user empty");
        const satsUser2: Entity = await satsUserRepository.save({ "userID": userID, totalSats: sats });
        console.log(satsUser2);
      } else {
        satsUser[0].totalSats = (sats + parseInt(satsUser[0].totalSats.toString()));
        satsUserRepository.save(satsUser[0]);
      }
    } catch (err) {
      console.error(err);
    }
    return true;
  }

  async getVotesForCampaign(campaignID: string, userID: string): Promise<GetVotesQueryResponse> {
    // console.log("in getVotesForCampaign...");

    // const votesNb: number = await voteRepository.search().return.count()
    // console.log(`Number of votes: ${votesNb}`)

    let allVotes: Entity[]

    if (userID === null) {
      allVotes = await voteRepository.search()
        // .where('date').matches('date01')  // type must be 'text'
        .where('campaignID').equals(campaignID)
        // .and('title').matches('butterfly')
        // .and('year').is.greaterThan(2000)
        .return.all()
    } else {
      allVotes = await voteRepository.search()
        .where('campaignID').equals(campaignID)
        .and('userID').equals(userID)
        .return.all()
    }

    // console.table(allVotes)
    // console.log('getVotesForCampaign entity: ' + allVotes[EntityId])

    let votesResponse: Vote[] = allVotes.map(x => Object(x)) // convert [Entity] to [Vote]  // REVIEW: send [Entity]
    // https://github.com/redis/redis-om-node/blob/main/README.md
    return { votes: votesResponse }
  }

  async getVotesForPoll(pollID: string, userID: string): Promise<GetVotesQueryResponse> {

    let allVotes: Entity[];

    if (userID === null) {
      allVotes = await voteRepository.search()
        .where('pollID').equals(pollID)
        .return.all()
    } else {
      allVotes = await voteRepository.search()
        .where('pollID').equals(pollID)
        .and('userID').equals(userID)
        .return.all()
    }
    let votesResponse: Vote[] = allVotes.map(x => Object(x));
    return { votes: votesResponse }
  }

  async getVotesForPollOption(pollOptionID: string, userID: string): Promise<GetVotesQueryResponse> {
    let allVotes: Entity[];

    if (userID === null) {
      allVotes = await voteRepository.search()
        .where('pollOptionID').equals(pollOptionID)
        .return.all()
    } else {
      allVotes = await voteRepository.search()
        .where('pollOptionID').equals(pollOptionID)
        .and('userID').equals(userID)
        .return.all()
    }

    let votesResponse: Vote[] = allVotes.map(x => Object(x));
    return { votes: votesResponse }
  }

  async getVotesForUser(userID: string): Promise<GetVotesQueryResponse> {
    const allVotes = await voteRepository.search()
      .where('userID').equals(userID)
      .return.all()
    let votesResponse: Vote[] = allVotes.map(x => Object(x));
    return { votes: votesResponse }
  }

  async getVoteById(voteID: string): Promise<Vote> {
    const exists = await redisClient.exists(`vote:${voteID}`)
    if (exists) {
      let vote = await voteRepository.fetch(voteID)
      return Object(vote)
    } else {
      return null
    }
  }
}