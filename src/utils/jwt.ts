import config from "config";

import jwt from "jsonwebtoken"

// const publicKey = Buffer.from( config.get<string>('PUBLIC_KEY'), "base64" ).toString('ascii');
// const privateKey = Buffer.from( config.get<string>('PRIVATE_KEY'), "base64" ).toString('ascii');
// const privateKey = config.get<string>('PRIVATE_KEY')


export class JwtUtil {
    private privateKey: string = config.get<string>('PRIVATE_KEY')
    // constructor() {

    // }

    async sign(): Promise<string> {
        // const token = jwt.sign("jkdjdla", this.privateKey);

        // const token = jwt.sign({ _id: "eiwf", name: "allo" }, privateKey, {
        // const token = await jwt.sign("jdkjldadjk", privateKey, {
        //     expiresIn: '2 days',
        //   });
        // console.log("token: ", token)
        // return token

        // const privateKey = config.get<string>('PRIVATE_KEY')
        // const token = sign({ data: 'foobar' }, privateKey);
        const token = jwt.sign("jkdjdla", this.privateKey);
        console.log("token: ", token)
        return token
    }

}

export function testenv() {
    console.log(config.get<string>('name'))
    const privateKey = config.get<string>('PRIVATE_KEY')
    // const token = sign({ data: 'foobar' }, privateKey);
    const token = jwt.sign("jkdjdla", privateKey);
    console.log("token: ", token)
}

// export function signJwt(object: Object, options?: jwt.SignOptions | undefined) {
//   return jwt.sign(object, privateKey, {
//     ...(options && options),
//     algorithm: "RS256"
//   })
// }
// export function signJwt() {
//     const token = jwt.sign({ foo: 'bar' }, 'shhhhh');
//     return token
// }

// export function verifyJwt<T>(token: string): T | null {
//   try {
//     const decoded = jwt.verify(token, publicKey) as T;
//     return decoded;
//   } catch(e) {
//     return null;
//   }
// }