export type AuthInfo = {
  domain: string;
  clientId: string;
  audience: string;
}

export const getAuthInfo = (): AuthInfo | undefined => {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const audience = process.env.AUTH0_AUDIENCE;
  if (!domain || !clientId || !audience) {
    return undefined;
  }
  return {
    domain,
    clientId,
    audience,
  };
};
