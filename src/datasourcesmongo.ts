

// // Use our automatically generated USER and AddUserMutationResponse types
// // for type safety in our data source class
// // import { objectEnumValues } from "@prisma/client/runtime/library";
import { AddUserMutationResponse, User } from "./__generated__/resolvers-types";

// // const UsersDB: Omit<Required<User>, "__typename">[] = usersData;

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export class DataSourcesMongo {

  async getUsers(): Promise<User[]> {
    console.log("prisma findMany")
    const users = await prisma.user.findMany({})

    // console.dir(users, { depth: Infinity })
    // console.log('----------')
    console.table(users)
    return users;
  }

  async getUserByName(name: string): Promise<User> {
    console.log("in getUserByName")
    console.log(name)
    const user = prisma.user.findFirst({where: {name: name}});
    return user;
  }

  async getUserById(id: string): Promise<User> {
    console.log("in getUser")
    console.log(id)
    const user = prisma.user.findUnique({where: {id: id}});
    // const user = prisma.user.findUnique({where: {id: "651efe317ef84f6cd52a4476"}});
    // const user = prisma.user.findUnique({where: {name: name}});
    return user;
  }

  async addUser(user: User): Promise<AddUserMutationResponse> {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        address: user.email,
        age: user.age
      },
    })

    // if (user.name) {
    //   prisma.user.create({
    //     email: user.email,
    //     name: user.name,
    //     address: user.address,
    //     age: user.age
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
}

