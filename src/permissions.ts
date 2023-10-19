import { shield, rule, and, or } from 'graphql-shield'

// const isAdmin = rule({ cache: 'contextual' })(async (_, __, ctx) => {
const isAdmin = rule()(async (_, __, ctx) => {
  let roleArray = JSON.parse(ctx.roles)
  return roleArray.includes('admin')
  // return true
})
export const permissions = shield({
  Query: {
    getUsers: and(isAdmin),
  }
})