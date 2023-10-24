

// // Use our automatically generated USER and AddUserMutationResponse types
// // for type safety in our data source class
// // import { objectEnumValues } from "@prisma/client/runtime/library";
import { User, AddUserMutationResponse, SignupMutationResponse, CampaignMutationResponse, CampaignInput } from "./__generated__/resolvers-types";

// // const UsersDB: Omit<Required<User>, "__typename">[] = usersData;

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export class DataSourcesMongo {

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
    // return user;
    return null;
  }

  async getUserByEmail(email: string): Promise<User> {
    console.log("in getUserByEmail")
    console.log(email)
    const user = await prisma.user.findUnique({ where: { email: email } });
    console.log("date user: " + user.creationDate)
    return user;
    // return null;
  }

  // async createCampaign(authorId: string, campaign: CampaignInput): Promise<CampaignMutationResponse> {
  async createCampaign(authorId: string, campaignInput: CampaignInput): Promise<CampaignMutationResponse> {
    console.table(campaignInput)
    let theIsoDate = new Date()
    // console.log(theIsoDate)
    var isodate = new Date().toISOString()

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
              // data: [{...campaignInput, creationDate: Date()}],
              // data: [{...campaignInput}],
              data: [{...campaignInput, creationDate: isodate}],
              // data: [{...campaignInput, creationDate: "2023-10-23T19:13:38.357+00:00"}],
              // data: [{...campaignInput, creationDate: new Date(isodate)}],
              // data: [{...campaignInput, creationDate: (new Date()).toISOString()}],
              // data: [{ title: 'My first post' }, { title: 'My second post' }],
            },
          },
        },
        include: {
          campaigns: true,
        },
      })
      return {
        code: "200",
        success: true,
        message: "Campaign created!",
        // campaign: result.campaigns[1]
        campaign: {
          title: campaignInput.title,
          question: campaignInput.question,
          description: campaignInput.description,
          authorId: authorId,
          // creationDate: result.campaigns[1].creationDate
          creationDate: theIsoDate
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

  async getUserById(id: string): Promise<User> {
    console.log("in getUser")
    console.log(id)
    const user = prisma.user.findUnique({ where: { id: id } });
    // const user = prisma.user.findUnique({where: {id: "651efe317ef84f6cd52a4476"}});
    // const user = prisma.user.findUnique({where: {name: name}});
    // return user;
    return null;
  }

  async addUser(user: User): Promise<AddUserMutationResponse> {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        roles: user.roles,
        password: user.password
      },
    })

    // if (user.name) {
    //   prisma.user.create({
    //     email: user.email,
    //     name: user.name,
    //     password: user.password
    //   });

    return {
      code: "200",
      success: true,
      message: "New user added!",
      user,
    }
    // } else {
    //   return {
    //     code: "400",
    //     success: false,
    //     message: "Invalid input",
    //     user: null,
    //   };
    // }
  }

  async signup(user: User): Promise<SignupMutationResponse> {
    // await prisma.user.create({
    //   data: user,
    // }).then((userx) => {
    //   return {
    //     code: "200",
    //     success: true,
    //     message: "New user created!",
    //     user: { ...userx, password: "********" },
    //   }
    // })

    let user2 = await prisma.user.create({
      data: user,
    })
    return {
      code: "200",
      success: true,
      message: "New user created!",
      user: { ...user2, password: "********" },
    }

    // return {
    //   code: "200",
    //   success: true,
    //   message: "New user created!",
    //   user: { ...user, password: "********" },
    // }
    // } else {
    //   return {
    //     code: "400",
    //     success: false,
    //     message: "Invalid input",
    //     user: null,
    //   };
    // }
  }

}

