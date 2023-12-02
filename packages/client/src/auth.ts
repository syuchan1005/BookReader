let isJumped = false;
export const goToAuthPage = () => {
  if (!isJumped) {
    isJumped = true;
    location.replace(`/auth/oidc/?r=${encodeURIComponent(location.pathname)}`);
  }
};
