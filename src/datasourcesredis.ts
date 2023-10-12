import { createClient } from 'redis'
import { Repository, EntityId, EntityKeyName, Entity } from 'redis-om'
const redisClient = createClient({
    // host: 'localhost',
    // port: 6379,
    password: 'rRTGwNDL7a'
})
redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect()
const aString = await redisClient.ping()
console.log('redis PING: ', aString)

import { Vote, VoteInput, AddVoteMutationResponse, GetVotesQueryResponse } from "./__generated__/resolvers-types";
import { voteSchema } from './schema.redis.js';

let voteRepository = new Repository(voteSchema, redisClient)
// await voteRepository.dropIndex();
await voteRepository.createIndex();  // required to use search (RediSearch)

export class DataSourcesRedis {
  // async addVote(voterID: string, invoice: string, date: number, campaignID: string, certified: boolean) {
  // async addVote({ voterID, invoice, date, campaignID, pollID, certified }: Vote): Promise<AddVoteMutationResponse> {
  async addVote(theVote: VoteInput): Promise<AddVoteMutationResponse> {
    const vote: Entity = await voteRepository.save(theVote);
    // console.log('entityId: ', vote[EntityId])
    // console.log('entityKeyName: ', vote[EntityKeyName])
    console.table(vote)
    // const exists = await redisClient.exists(`vote:${vote[EntityId]}`)
    const exists = await redisClient.exists(vote[EntityKeyName])
    if (exists) {
      return {
        code: "200",
        success: true,
        message: "New vote added!",
        vote: Object(vote), // vote is of type Symbol
      }
    } else {
      return {
        code: "400",
        success: false,
        message: "Problem adding new vote!",
        vote: null
      }
    }
  }

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