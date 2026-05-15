import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { env, isGoogleOAuthEnabled } from './env.js'
import { findOrCreateGoogleProfile } from '../modules/auth/auth.store.js'

export type GoogleAuthUser = {
  userId: string
  sessionMask: string
  defaultHouseholdId: string | null
}

export function configurePassport() {
  if (!isGoogleOAuthEnabled()) {
    return
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL:
          env.GOOGLE_CALLBACK_URL ??
          `http://localhost:${env.PORT}/v1/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value

          if (!email) {
            done(new Error('Google profile did not include an email address'))
            return
          }

          const user = await findOrCreateGoogleProfile({
            email,
            oauthSub: profile.id,
            displayName: profile.displayName ?? null,
          })

          done(null, {
            userId: user.id,
            sessionMask: user.phoneNumberMasked,
            defaultHouseholdId: user.defaultHouseholdId,
          })
        } catch (error) {
          done(error as Error)
        }
      },
    ),
  )
}

export { passport }
