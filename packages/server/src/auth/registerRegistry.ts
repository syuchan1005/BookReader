import passport from 'passport';
import { Strategy as OIDCStrategy } from 'passport-openidconnect';

export interface OIDCConfig {
  issuer: string,
  authorizationURL: string,
  tokenURL: string,
  userInfoURL: string,
  clientID: string,
  clientSecret: string,
  callbackURL: string,
}

export const registerRegistry = (oidcConfig: OIDCConfig | undefined) => {
  if (oidcConfig) {
    passport.use(
      new OIDCStrategy(oidcConfig, (issuer, profile, callback) => callback(null, profile)),
    );
  }
};
