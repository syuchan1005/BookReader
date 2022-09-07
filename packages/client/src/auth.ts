let isJumped = false;
export const goToAuthPage = () => {
  if (!isJumped) {
    isJumped = true;
    // eslint-disable-next-line no-restricted-globals
    location.replace(`/auth/oidc/?r=${encodeURIComponent(location.pathname)}`);
  }
};
