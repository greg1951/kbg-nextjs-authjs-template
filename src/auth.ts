import NextAuth from "next-auth";

import Credentials from 'next-auth/providers/credentials';
import { authValidation } from "./features/auth/services/auth-utils";

type AuthRecord = {
  email: string;
  password: string;
  token?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    jwt({token, user}) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({session, token}) {
        session.user.id = token.id as string;
        return session;
    }
  }, //end callbacks
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        token: {},
      },
      async authorize(credentials) {
        const userEmail = credentials.email;
        const userPassword = credentials.password;
        const token = credentials.token;

        const authRecord:AuthRecord = {
          email: userEmail as string,
          password: userPassword as string,
          token: token as string,
        };

        // console.log('authorize->authRecord: ', authRecord);

        const validationResult = await authValidation(authRecord);

        // console.log('authorize->validationResult: ', validationResult);
        if (validationResult.error) {
          // throw new Error("Invalid credentails");
          return null;
        }
        return  validationResult;      
      }
    })
  ],
});