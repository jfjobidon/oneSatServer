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
const osovId = "859058920934" // TODO: put that in config file

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

export class DataSourcesRedis {
  // async addVote(userId: string, invoice: string, date: number, campaignId: string, certified: boolean) {
  // async addVote({ userId, invoice, date, campaignId, pollId, certified }: Vote): Promise<AddVoteMutationResponse> {
  async addVote(voteInput: VoteInput): Promise<AddVoteMutationResponse> {
    // TODO: tester createAndSave
    const voteCode = randomstring.generate(12); // REVIEW: nanoId ???
    console.log(voteCode);
    const currentDate = new Date;
    const vote: Entity = await voteRepository.save({ ...voteInput, voteCode: voteCode, date: currentDate.toString() });
    console.table(vote);
    // console.log('entityId: ', vote[entityId])
    console.log('entityKeyName: ', vote[EntityKeyName])
    // const exists = await redisClient.exists(`vote:${vote[EntityId]}`)
    const exists = await redisClient.exists(vote[EntityKeyName])
    if (exists) {
      // REVIEW: quoi faire si return false ???
      // await this.incrPollOption(voteInput.pollOptionId, voteInput.sats);
      await this.incrPoll(voteInput.pollId, voteInput.sats);
      await this.incrCampaign(voteInput.campaignId, voteInput.userId, voteInput.sats);
      // await this.incrUser(voteInput.userId, voteInput.sats);
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

  async incrPollOption(pollOptionId: string, sats: number): Promise<Boolean> {
    try {
      // increments sats for PollOption
      console.log("pollOptionId", pollOptionId);
      const satsPollOption: Entity[] = await satsPollOptionRepository.search().where('pollOptionId').equals(pollOptionId).return.all();
      console.log(satsPollOption);
      if (satsPollOption.length == 0) {
        console.log("satsPollOption empty");
        const pollOption2: Entity = await satsPollOptionRepository.save({ "pollOptionId": pollOptionId, sats: sats });
        console.log(pollOption2);
      } else {
        satsPollOption[0].sats = (sats + parseInt(satsPollOption[0].sats.toString()));
        satsPollOptionRepository.save(satsPollOption[0]);
      }
      // increments votes for PollOption
      const votesPollOption: Entity[] = await votesPollOptionRepository.search().where('pollOptionId').equals(pollOptionId).return.all();
      console.log(votesPollOption);
      if (votesPollOption.length == 0) {
        console.log("votesPollOption empty");
        const votesPollOption2: Entity = await votesPollOptionRepository.save({ "pollOptionId": pollOptionId, votes: 1 });
        console.log(votesPollOption2);
      } else {
        votesPollOption[0].votes = (1 + parseInt(votesPollOption[0].votes.toString()));
        votesPollOptionRepository.save(votesPollOption[0]);
      }
      // TODO: remove this: just for debugging now
      // increments views for PollOption
      // REVIEW: remplacer par INCRBY pollOptionId 1
      const viewsPollOption: Entity[] = await viewsPollOptionRepository.search().where('pollOptionId').equals(pollOptionId).return.all();
      console.log("viewsPollOption", viewsPollOption);
      if (viewsPollOption.length == 0) {
        console.log("viewsPollOption empty");
        const viewsPollOption2: Entity = await viewsPollOptionRepository.save({ "pollOptionId": pollOptionId, views: 1 });
        console.log(viewsPollOption2);
      } else {
        viewsPollOption[0].views = (1 + parseInt(viewsPollOption[0].views.toString()));
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
    // let entityId = pollOption0[EntityId];
    // const pollop = await satsPollOptionRepository.fetch(entityId);
    // pollop.sats = (sats + parseInt(pollop.sats.toString()));
    // satsPollOptionRepository.save(pollop);

  async incrPoll(pollId: string, sats: number): Promise<Boolean> {
    try {
      console.log(pollId);
      // increment sat for Poll
      const satsPoll: Entity[] = await satsPollRepository.search().where('pollId').equals(pollId).return.all();
      console.log(satsPoll);
      if (satsPoll.length == 0) {
        console.log("poll empty");
        const poll2: Entity = await satsPollRepository.save({ "pollId": pollId, sats: sats });
        console.log(poll2);
      } else {
        satsPoll[0].sats = (sats + parseInt(satsPoll[0].sats.toString()));
        satsPollRepository.save(satsPoll[0]);
      }

      // increment votes for Poll
      const votesPoll: Entity[] = await votesPollRepository.search().where('pollId').equals(pollId).return.all();
      console.log(votesPoll);
      if (votesPoll.length == 0) {
        console.log("poll empty");
        const votesPoll2: Entity = await votesPollRepository.save({ "pollId": pollId, votes: 1 });
        console.log(votesPoll2);
      } else {
        votesPoll[0].votes = (1 + parseInt(votesPoll[0].votes.toString()));
        votesPollRepository.save(votesPoll[0]);
      }

      // increments views for Poll
      const viewsPoll: Entity[] = await viewsPollRepository.search().where('pollId').equals(pollId).return.all();
      console.log("viewsPoll", viewsPoll);
      if (viewsPoll.length == 0) {
        console.log("viewsPoll empty");
        const viewsPoll2: Entity = await viewsPollRepository.save({ "pollId": pollId, views: 1 });
        console.log(viewsPoll2);
      } else {
        viewsPoll[0].views = (1 + parseInt(viewsPoll[0].views.toString()));
        viewsPollRepository.save(viewsPoll[0]);
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true;
  }

  async getSatsForCampaign(campaignId: string): Promise<number> {
    const satCampaign: Entity[] = await satsCampaignRepository.search().where('campaignId').equals(campaignId).return.all();
    let sats: number = 0
    if (satCampaign.length == 0) {
      sats = 0
    } else {
      sats = parseInt((satCampaign[0].sats).toString())
    }
    return sats
  }

  async getSatsForPoll(pollId: string): Promise<number> {
    const satPoll: Entity[] = await satsPollRepository.search().where('pollId').equals(pollId).return.all();
    let sats: number = 0
    if (satPoll.length == 0) {
      sats = 0
    } else {
      sats = parseInt((satPoll[0].sats).toString())
    }
    return sats
  }

  async getNbVotesForCampaign(campaignId: string): Promise<number> {
    const voteCampaign: Entity[] = await votesCampaignRepository.search().where('campaignId').equals(campaignId).return.all();
    let nbVotes: number
    if (voteCampaign.length == 0) {
      nbVotes = 0
    } else {
      nbVotes = parseInt((voteCampaign[0].votes).toString())
    }
    return nbVotes
  }
  
  async getNbVotesForPoll(pollId: string): Promise<number> {
    const votePoll: Entity[] = await votesPollRepository.search().where('pollId').equals(pollId).return.all();
    let nbVotes: number
    // console.log("votePollOBJ", votePoll)
    if (votePoll.length == 0) {
      nbVotes = 0
    } else {
      nbVotes = parseInt((votePoll[0].votes).toString())
    }
    return nbVotes
  }

  async getViewsForPoll(pollId: string): Promise<number> {
    // console.log("pollId", pollId)
    const viewsPoll: Entity[] = await viewsPollRepository.search().where('pollId').equals(pollId).return.all();
    let views: number
    if (viewsPoll.length == 0) {
      views = 0
    } else {
      views = parseInt((viewsPoll[0].views).toString())
    }
    return views
  }

  async getNbViewsForCampaign(campaignId: string): Promise<number> {
    const viewsCampaign: Entity[] = await viewsCampaignRepository.search().where('campaignId').equals(campaignId).return.all();
    let nbViews: number
    if (viewsCampaign.length == 0) {
      nbViews = 0
    } else {
      nbViews = parseInt((viewsCampaign[0].views).toString())
    }
    return nbViews
  }
 

  async incrCampaign(campaignId: string, userId: string, sats: number): Promise<Boolean> {
    try {
      console.log(campaignId);
      // increments sats for Campaign
      const satsCampaign: Entity[] = await satsCampaignRepository.search().where('campaignId').equals(campaignId).return.all();
      console.log(satsCampaign);
      let satsUser: number  // sats won by user
      let satsOSOV: number  // sat won by me
      if (satsCampaign.length == 0) {
        console.log("campaign empty");
        // compute the gain of the user and osov
        satsUser = Math.floor(sats / 2) + 1
        satsOSOV = sats - satsUser
        this.incrUser(userId, satsUser)
        this.incrUser(osovId, satsOSOV)
        const campaign2: Entity = await satsCampaignRepository.save({ "campaignId": campaignId, sats: sats });
        console.log(campaign2);
      } else {
        // before
        let beforeSatsCampaign = parseInt(satsCampaign[0].sats.toString())
        const beforeSatsUser = Math.floor(beforeSatsCampaign / 2) + 1
        const beforeSatsOSOV = beforeSatsCampaign - beforeSatsUser
        // after
        // compute the gain of the user and osov
        const afterSatsCampaign = beforeSatsCampaign + sats
        const afterSatsUser = Math.floor(afterSatsCampaign / 2) + 1
        const afterSatsOSOV = afterSatsCampaign - afterSatsUser
        this.incrUser(userId, afterSatsUser - beforeSatsUser)
        this.incrUser(osovId, afterSatsOSOV - beforeSatsOSOV)

        satsCampaign[0].sats = (sats + beforeSatsCampaign);
        satsCampaignRepository.save(satsCampaign[0]);
      }

      // increments votes for Campaign
      const votesCampaign: Entity[] = await votesCampaignRepository.search().where('campaignId').equals(campaignId).return.all();
      console.log(votesCampaign);
      if (votesCampaign.length == 0) {
        console.log("campaign empty");
        const votesCampaign2: Entity = await votesCampaignRepository.save({ "campaignId": campaignId, votes: 1 });
        console.log(votesCampaign2);
      } else {
        votesCampaign[0].votes = (1 + parseInt(votesCampaign[0].votes.toString()));
        votesCampaignRepository.save(votesCampaign[0]);
      }

      // increments views for Campaign
      const viewsCampaign: Entity[] = await viewsCampaignRepository.search().where('campaignId').equals(campaignId).return.all();
      console.log("viewsCampaign", viewsCampaign);
      if (viewsCampaign.length == 0) {
        console.log("viewsCampaign empty");
        const viewsCampaign2: Entity = await viewsCampaignRepository.save({ "campaignId": campaignId, views: 1 });
        console.log(viewsCampaign2);
      } else {
        viewsCampaign[0].views = (1 + parseInt(viewsCampaign[0].views.toString()));
        viewsCampaignRepository.save(viewsCampaign[0]);
      }

    } catch (err) {
      console.error(err);
    }
    return true;
  }

  // Documentation....
  async incrUser(userId: string, sats: number): Promise<Boolean> {
    try {
      console.log(userId)
      // increments sats for User
      const satsUser: Entity[] = await satsUserRepository.search().where('userId').equals(userId).return.all();
      console.log(satsUser);
      if (satsUser.length == 0) {
        console.log("user empty");
        const satsUser2: Entity = await satsUserRepository.save({ "userId": userId, sats: sats });
        console.log(satsUser2);
      } else {
        satsUser[0].sats = (sats + parseInt(satsUser[0].sats.toString()));
        satsUserRepository.save(satsUser[0]);
      }
    } catch (err) {
      console.error(err);
    }
    return true;
  }

  async getVotesForCampaign(campaignId: string, userId: string): Promise<GetVotesQueryResponse> {
    // console.log("in getVotesForCampaign...");

    // const votesNb: number = await voteRepository.search().return.count()
    // console.log(`Number of votes: ${votesNb}`)

    let allVotes: Entity[]

    if (userId === null) {
      allVotes = await voteRepository.search()
        // .where('date').matches('date01')  // type must be 'text'
        .where('campaignId').equals(campaignId)
        // .and('title').matches('butterfly')
        // .and('year').is.greaterThan(2000)
        .return.all()
    } else {
      allVotes = await voteRepository.search()
        .where('campaignId').equals(campaignId)
        .and('userId').equals(userId)
        .return.all()
    }

    // console.table(allVotes)
    // console.log('getVotesForCampaign entity: ' + allVotes[EntityId])

    let votesResponse: Vote[] = allVotes.map(x => Object(x)) // convert [Entity] to [Vote]  // REVIEW: send [Entity]
    // https://github.com/redis/redis-om-node/blob/main/README.md
    return { votes: votesResponse }
  }

  async getVotesForPoll(pollId: string, userId: string): Promise<GetVotesQueryResponse> {

    let allVotes: Entity[];

    if (userId === null) {
      allVotes = await voteRepository.search()
        .where('pollId').equals(pollId)
        .return.all()
    } else {
      allVotes = await voteRepository.search()
        .where('pollId').equals(pollId)
        .and('userId').equals(userId)
        .return.all()
    }
    let votesResponse: Vote[] = allVotes.map(x => Object(x));
    return { votes: votesResponse }
  }

  async getVotesForPollOption(pollOptionId: string, userId: string): Promise<GetVotesQueryResponse> {
    let allVotes: Entity[];

    if (userId === null) {
      allVotes = await voteRepository.search()
        .where('pollOptionId').equals(pollOptionId)
        .return.all()
    } else {
      allVotes = await voteRepository.search()
        .where('pollOptionId').equals(pollOptionId)
        .and('userId').equals(userId)
        .return.all()
    }

    let votesResponse: Vote[] = allVotes.map(x => Object(x));
    return { votes: votesResponse }
  }

  async getVotesForUser(userId: string): Promise<GetVotesQueryResponse> {
    const allVotes = await voteRepository.search()
      .where('userId').equals(userId)
      .return.all()
    let votesResponse: Vote[] = allVotes.map(x => Object(x));
    return { votes: votesResponse }
  }

  async getVoteById(voteId: string): Promise<Vote> {
    const exists = await redisClient.exists(`vote:${voteId}`)
    if (exists) {
      let vote = await voteRepository.fetch(voteId)
      return Object(vote)
    } else {
      return null
    }
  }
}