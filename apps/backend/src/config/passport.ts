import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { and, eq, isNull } from 'drizzle-orm';
import { db, adminUsers, type AdminUserRow } from '../database/client';
import { config, isGoogleOAuthConfigured } from './index';

if (isGoogleOAuthConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: `${config.backendUrl}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(null, false, { message: 'no_email' });
          }

          const [adminUser] = await db
            .select()
            .from(adminUsers)
            .where(and(eq(adminUsers.email, email), isNull(adminUsers.deletedAt)));

          if (!adminUser || adminUser.estado !== 'ativo') {
            return done(null, false, { message: 'not_authorized' });
          }

          return done(null, adminUser as AdminUserRow);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
} else {
  console.warn(
    '[GOOGLE OAUTH] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados — login desabilitado.',
  );
}

export default passport;
