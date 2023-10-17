import { QueryResolvers, SignupMutationResponse } from "../__generated__/resolvers-types";

import { DataSourcesRedis } from '../datasourcesredis.js';
const dataSourcesRedis = new DataSourcesRedis();

import { DataSourcesMongo } from "../datasourcesmongo.js";
import { GraphQLError } from "graphql";
const dataSourcesMongo = new DataSourcesMongo()
import { testenv } from '../utils/jwt.js';
import bcrypt from "bcrypt";
import { JwtUtil } from "../utils/jwt.js";
const jwtUtil = new JwtUtil()

const queries: QueryResolvers = {

  placeholder: async (_, __generated__) => {
    return true
  },

  getUsers: async (_, __, contextValue) => {
    testenv()
    let users = await dataSourcesMongo.getUsers();
    // if (true) throw new GraphQLError("you must be logged in to query this schema", {
    //   extensions: {
    //     code: 'UNAUTHENTICATED',
    //   },
    // });
    // if (true) throw new GraphQLError('You are not authorized to perform this action.', {
    //   extensions: {
    //     code: 'FORBIDDEN',
    //     argumentName: 'tokenID',
    //     alpha: 'beta'
    //   },
    // });
    return users.map((user) => {
      return { ...user, password: "********" };
    });
  },

  getUserById: async (_, args) => {
    const user = await dataSourcesMongo.getUserById(args.id);
    return { ...user, password: "********"}
  },

  getUserByName: async (_, args) => {
    const user = await dataSourcesMongo.getUserByName(args.name);
    return { ...user, password: "********"}
  },

  getUserByEmail: async (_, args) => {
    const user = await dataSourcesMongo.getUserByEmail(args.email);
    return { ...user, password: "********"}
  },

  login: async (_, { email, password }): Promise<SignupMutationResponse> => {
    let user = await dataSourcesMongo.getUserByEmail(email);
    const token = await jwtUtil.sign();

    if (user) {
      const match = await bcrypt.compare(password, user.password);  // REVIEW: password encrypté dans le client !!??
      if (match) {
        return {
          code: '200',
          success: true,
          message: "user successfully logged",
          token: token,
          user: { ...user, password: "********"}
        }
      } else {
        return {
          code: '200',
          success: false,
          message: "unknown combination email/passwword",
          token: null,
          user: null
        }
      }
    } else {
      return {
        code: '200',
        success: false,
        message: "unknown combination email/passwword",
        token: null,
        user: null
      }
    }
  },

  getVotes: async (_, __) => {
    console.log("getVotes from client");
    return await dataSourcesRedis.getVotes();
  },

  getVoteById: async (_, args) => {
    return dataSourcesRedis.getVoteById(args.id);
  },
}

export default queries;
