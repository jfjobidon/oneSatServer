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

import randomstring from "randomstring";

import { Vote, VoteInput, AddVoteMutationResponse, GetVotesQueryResponse } from "./__generated__/resolvers-types";
// import { voteSchema } from './schema.redis.js';
import { voteSchema, satsPollOptionSchema, satsPollSchema, satsCampaignSchema } from './schema.redis.js';

let voteRepository = new Repository(voteSchema, redisClient);
// await voteRepository.dropIndex();
await voteRepository.createIndex();  // required to use search (RediSearch)

let satsPollOptionRepository = new Repository(satsPollOptionSchema, redisClient);
await satsPollOptionRepository.createIndex();
let satsPollRepository = new Repository(satsPollSchema, redisClient);
await satsPollRepository.createIndex();
let satsCampaignRepository   = new Repository(satsCampaignSchema, redisClient);
await satsCampaignRepository.createIndex();

export class DataSourcesRedis {
  // async addVote(userID: string, invoice: string, date: number, campaignID: string, certified: boolean) {
  // async addVote({ userID, invoice, date, campaignID, pollID, certified }: Vote): Promise<AddVoteMutationResponse> {
  async addVote(voteInput: VoteInput): Promise<AddVoteMutationResponse> {
    // TODO: tester createAndSave
    const voteCode = randomstring.generate(12);
    console.log(voteCode);
    const currentDate = new Date;
    const vote: Entity = await voteRepository.save({...voteInput, voteCode: voteCode, date: currentDate.toString() });
    console.table(vote);
    console.log('entityId: ', vote[EntityId])
    console.log('entityKeyName: ', vote[EntityKeyName])
    // const exists = await redisClient.exists(`vote:${vote[EntityId]}`)
    const exists = await redisClient.exists(vote[EntityKeyName])
    // const exists = true;
    if (exists) {
      await this.incrPollOption(voteInput.pollOptionID, voteInput.sats);
      await this.incrPoll(voteInput.pollID, voteInput.sats);
      await this.incrCampaign(voteInput.campaignID, voteInput.sats);
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
      console.log(pollOptionID);
      const pollOption: Entity[] = await satsPollOptionRepository.search().where('pollOptionID').equals(pollOptionID).return.all();
      console.log(pollOption);
      if (pollOption.length == 0) {
        console.log("pollOption empty");
        const pollOption2: Entity = await satsPollOptionRepository.save({"pollOptionID": pollOptionID, totalSats: sats});
        console.log(pollOption2);
      } else {
        pollOption[0].totalSats = (sats + parseInt(pollOption[0].totalSats.toString()));
        satsPollOptionRepository.save(pollOption[0]);
      }
    } catch(err) {
      console.error(err);
    }
    // REVIEW: other way to do it:
    // let pollOption0 = pollOption2[0]
    // let entityID = pollOption0[EntityId];
    // const pollop = await satsPollOptionRepository.fetch(entityID);
    // pollop.totalSats = (sats + parseInt(pollop.totalSats.toString()));
    // satsPollOptionRepository.save(pollop);
    return true;
  }

  // TODO: DEBUG: le search ne fonctionne pas !!!
  async incrPoll(pollID: string, sats: number): Promise<Boolean> {  
    try {
      console.log(pollID);
      const poll: Entity[] = await satsPollRepository.search().where('pollID').equals(pollID).return.all();
      console.log(poll);
      if (poll.length == 0) {
        console.log("poll empty");
        const poll2: Entity = await satsPollRepository.save({"pollID": pollID, totalSats: sats});
        console.log(poll2);
      } else {
        poll[0].totalSats = (sats + parseInt(poll[0].totalSats.toString()));
        satsPollRepository.save(poll[0]);
      }
    } catch(err) {
      console.error(err);
    }
    return true;
  }

  async incrCampaign(campaignID: string, sats: number): Promise<Boolean> {  
    try {
      console.log(campaignID);
      const campaign: Entity[] = await satsCampaignRepository.search().where('campaignID').equals(campaignID).return.all();
      console.log(campaign);
      if (campaign.length == 0) {
        console.log("campaign empty");
        const campaign2: Entity = await satsCampaignRepository.save({"campaignID": campaignID, totalSats: sats});
        console.log(campaign2);
      } else {
        campaign[0].totalSats = (sats + parseInt(campaign[0].totalSats.toString()));
        satsCampaignRepository.save(campaign[0]);
      }
    } catch(err) {
      console.error(err);
    }
    return true;
  }

  // async incrPoll(pollID: string, sats: number): Promise<Boolean> {  
  //   try {
  //     console.log(pollID);
  //     const poll: Entity[] = await satsPollRepository.search().where('pollID').equals(pollID).return.all();
  //     console.log(poll);
  //     if (poll.length == 0) {
  //       console.log("poll empty");
  //       const poll2: Entity = await satsPollRepository.save({"pollID": pollID, totalSats: sats});
  //       console.log(poll2);
  //     } else {
  //       poll[0].totalSats = (sats + parseInt(poll[0].totalSats.toString()));
  //       satsPollRepository.save(poll[0]);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  //   return true;
  // }

  async getVotes(): Promise<GetVotesQueryResponse> {
    console.log("in getVotes...")

    // const votesNb: number = await voteRepository.search().return.count()
    // console.log(`Number of votes: ${votesNb}`)

    const allVotes = await voteRepository.search()
    // .where('date').matches('date01')  // type must be 'text'
    // .where('date').equals('date01')
    // .and('title').matches('butterfly')
    // .and('year').is.greaterThan(2000)
    .return.all()

    console.table(allVotes)
    console.log('getVotes entity: ' + allVotes[EntityId])

    let votesResponse: Vote[] = allVotes.map(x => Object(x)) // convert [Entity] to [Vote]  // REVIEW: send [Entity]
    // https://github.com/redis/redis-om-node/blob/main/README.md
    return {votes: votesResponse}
  }

  async getVoteById(voteID: string): Promise<Vote>{
    // const exists = await redisClient.exists(voteID)
    const exists = await redisClient.exists(`vote:${voteID}`)
    if (exists) {
      let vote = await voteRepository.fetch(voteID)
      // let vote = await voteRepository.fetch('vote:01HCAK7PMK48C61M9ME93J3WJ6')
      return Object(vote)
    } else {
      return null
    }
  }
}