import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { nextAuthUserByEmail } from "./db/queries-users";
import { hashPasswordWithSalt } from "./lib/hash";
 
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
      },
      async authorize(credentials) {
        console.info("running Credentials->authorize...");
        const user = await nextAuthUserByEmail(credentials.email as string);

        if (!user) {
          throw new Error("user is null: Incorrect credentials");
        }
        else {
          // console.log('Credentials->credentials.password: ', credentials.password, 'user.salt:', user.salt);
          const hashedInputPassword = hashPasswordWithSalt(credentials.password as string, user.salt);
          console.log('Credentials->user.password: ', user.password, ' hashedInputPassword: ', hashedInputPassword);
          const passwordCorrect = user.password === hashedInputPassword? true : false;
          if (!passwordCorrect) {
            console.error('NEXT_REDIRECT error?');
            throw new Error("Invalid credentials");
          }          
        }
        /* returning "id" of type string is expected to get a JWT token */
        return {
          id: user.id.toString(),
          email: user.email 
        }
      }
    })
  ],
})