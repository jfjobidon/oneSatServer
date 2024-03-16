import { Schema } from 'redis-om';

// Valid types are: string, number, boolean, string[], number[], date, point, and text
// number[] is only possible when working with JSON
export const voteSchema = new Schema('vote', {
  voterID: { type: 'string' },
  invoice: { type: 'string' },
  date: { type: 'string' },
  campaignID: { type: 'string'},
  pollID: { type: 'string'},
  pollOptionID: { type: 'string'},
  certified: { type: 'boolean' },
  // songDurations: { type: 'number[]' } only valid for JSON !!!
}, {
  dataStructure: 'HASH'
})