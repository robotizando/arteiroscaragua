import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { and, eq, isNull } from 'drizzle-orm';
import { db, adminUsers, type AdminUserRow } from '../database/client';
import type { GoogleSitePerfil } from '../modules/conta/conta.service';
import { config, isGoogleOAuthConfigured } from './index';

export const GOOGLE_SITE_STRATEGY = 'google-site';

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
            return done(null, false, { message: 'not_authorized', email } as { message: string });
          }

          return done(null, adminUser as AdminUserRow);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );

  // Login/cadastro dos usuários do site: só extrai o perfil; as regras ficam no conta.service.
  passport.use(
    GOOGLE_SITE_STRATEGY,
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: `${config.backendUrl}/api/conta/google/callback`,
        scope: ['profile', 'email'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0];
        const perfil: GoogleSitePerfil = {
          googleId: profile.id,
          email: email?.value?.toLowerCase() ?? null,
          emailVerificado: String(profile._json.email_verified ?? email?.verified) === 'true',
          nome: profile.displayName || email?.value?.split('@')[0] || 'Arteiro',
        };
        return done(null, perfil as unknown as Express.User);
      },
    ),
  );
} else {
  console.warn(
    '[GOOGLE OAUTH] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados — login desabilitado.',
  );
}

export default passport;
