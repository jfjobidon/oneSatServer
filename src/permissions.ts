import { shield, rule, and, or } from 'graphql-shield'

enum Roles {
  SUPEADMIN = 'SUPEADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  OWNER = 'OWNER'
}

// const isAdmin = rule({ cache: 'contextual' })(async (_, __, ctx) => {
const isAdmin = rule()(async (_, __, ctx) => {
  let roleArray = JSON.parse(ctx.roles)
  return roleArray.includes(Roles.ADMIN)
  // return true
})

const isUser = rule()(async (_, __, ctx) => {
  let roleArray = JSON.parse(ctx.roles)
  return roleArray.includes(Roles.USER)
})

// const isOwner = rule()(async (_, __, ctx) => {
//   let roleArray = JSON.parse(ctx.roles)
//   return roleArray.includes(Roles.OWNER)
//   // return true
// })

export const permissions = shield({
  Query: {
    getUsers: isAdmin
  },
  Mutation: {
    createCampaign: isUser
  }
}
)