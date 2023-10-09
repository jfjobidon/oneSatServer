import { createClient } from 'redis'
import { Repository, EntityId } from 'redis-om'
const redisClient = createClient({
    // host: 'localhost',
    // port: 6379,
    password: 'rRTGwNDL7a'
})
redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect()
const aString = await redisClient.ping()
console.log('redis PING: ', aString)

import { Vote, AddVoteMutationResponse, GetVotesQueryResponse } from "./__generated__/resolvers-types";

// import { voteSchema } from './schema.redis'; // ??? DEBUG:
import { Schema } from 'redis-om';

// Valid types are: string, number, boolean, string[], number[], date, point, and text
// number[] is only possible when working with JSON
const voteSchema = new Schema('vote', {
  voterID: { type: 'string' },
  invoice: { type: 'string' },
  date: { type: 'string' },
  campaignID: { type: 'string' },
  pollID: { type: 'string' },
  certified: { type: 'boolean' },
  // songDurations: { type: 'number[]' } only valid for JSON !!!
}, {
  dataStructure: 'HASH'
})

let voteRepository = new Repository(voteSchema, redisClient)
// await voteRepository.dropIndex();
await voteRepository.createIndex();  // required to use search

export class DataSourcesRedis {

  // async addVote(voterID: string, invoice: string, date: number, campaignID: string, certified: boolean) {
  async addVote({ voterID, invoice, date, campaignID, pollID, certified }: Vote): Promise<AddVoteMutationResponse> {
    console.log("in addvote...")
    // let vote = await voteRepository.save('myEntityId', { // key = vote:myEntityId
    console.log(`voterID: ${voterID}`)
    console.log(`invoice: ${invoice}`)
    console.log(`date: ${date}`)
    console.log(`campaignID: ${campaignID}`)
    console.log(`pollID: ${pollID}`)
    console.log(`certified: ${certified}`)
    let vote = await voteRepository.save({
      voterID,
      invoice,
      date,
      campaignID,
      pollID,
      certified
    });
    console.log('vote: ' + vote)
    console.table(vote)
    console.log('vote EntityId: ' + vote[EntityId])
    console.log('vote EntityId: ' + vote[EntityId])

    let voteReturned = {
      voterID,
      invoice,
      date,
      campaignID,
      pollID,
      certified
    }
    console.table(voteReturned)
    return {
      code: "200",
      success: true,
      message: "New vote added!",
      vote: voteReturned, // TODO: voteReturned --> vote[EntityId]
    }
  }

  //  async getVotes(): Promise<{votes: String}>{
  async getVotes(): Promise<GetVotesQueryResponse> {
    console.log("in getVotes...")

    const allVotes = await voteRepository.search()
    // .where('date').matches('date01')  // type must be 'text'
    // .where('date').equals('date01')
    // .and('title').matches('butterfly')
    // .and('year').is.greaterThan(2000)
    .return.all()

    // OK
    // const exists = await redisClient.exists('vote:01HCAK7PMK48C61M9ME93J3WJ6')
    // console.log('exists: ' + exists);

    //set an entity to expire after a certain number of seconds
    // const ttlInSeconds = 12 * 60 * 60  // 12 hours
    // await albumRepository.expire('01FJYWEYRHYFT8YTEGQBABJ43J', ttlInSeconds)

    // const voteX = await voteRepository.fetch('aaaa')
    // console.log('new vote')
    // console.table(voteX)
    // voteX.date = 'updating date'
    // voteRepository.save(voteX)  // will update the document
    // // pour créer une nouvelle entrée: changer le entity ID
    // console.log('new voteX')
    // console.table(voteX)


    // If you have RediSearch installed on your Redis server
    //   // await voteRepository.createIndex()
    // const allVotes = await voteRepository.search().returnAll()
    //   let allVotes = await voteRepository.fetch()
    // console.log('getVotes: ' + JSON.stringify(allVotes, null, 2))
    console.table(allVotes)
    console.log('getVotes entity: ' + allVotes[EntityId])
    //   // console.log('votes2: ' + allVotes)
    // return { votes: "all votes" }
    return allVotes[EntityId]
  }

  // async getVotes(): Promise<GetVotesQueryResponse>{
  // async getVotes(): Promise<{ votes: String }>{
  //   console.log("in addvote...")
  //   let votes = voteRepository.fetch();
  //   console.log(votes)
  //   return {
  //     votes: "votes",
  //   }
  // }
}