import React from 'react';
import {
  Avatar,
  Icon,
  IconButton,
  keyframes,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { useApolloClient } from '@apollo/client';
import { alertDataState, hasAuth0State } from '@client/store/atoms';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import synchronize from '@client/indexedDb/ReadSynchonizer';

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const UserMenuButton = () => {
  const {
    loginWithRedirect,
    isAuthenticated,
    logout: logoutAuth0,
    user,
    getAccessTokenSilently,
    isLoading: isAuthenticatedLoading,
  } = useAuth0();
  const logout = React.useCallback(() => {
    logoutAuth0({ returnTo: window.location.origin });
  }, [logoutAuth0]);
  const hasAuth0 = useRecoilValue(hasAuth0State);
  const [anchor, setAnchor, clearAnchor] = useMenuAnchor();
  const clickLogout = React.useCallback(() => {
    clearAnchor();
    logout();
  }, [clearAnchor, logout]);
  const setAlertData = useSetRecoilState(alertDataState);

  const apolloClient = useApolloClient();
  const [loading, setLoading] = React.useState(false);
  const clickSynchronize = React.useCallback(() => {
    setLoading(true);
    getAccessTokenSilently()
      .then((accessToken) => synchronize(apolloClient, accessToken))
      .catch((e) => {
        let message;
        if (typeof e.message === 'string' && e.message.startsWith('Unauthorized permission requested')) {
          message = 'The permissions are insufficient. Please contact administrator.';
        } else {
          message = 'Network error';
        }
        setAlertData({
          message,
          variant: 'error',
          persist: false,
        });
      })
      .finally(() => {
        setLoading(false);
        clearAnchor();
      });
  }, [apolloClient, getAccessTokenSilently, clearAnchor, setAlertData]);

  if (!hasAuth0) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Tooltip title="Login">
        <IconButton
          sx={{ color: 'common.white' }}
          onClick={() => loginWithRedirect()}
          disabled={isAuthenticatedLoading}
        >
          <Icon>login</Icon>
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <>
      <Avatar
        alt={user?.name}
        src={user?.picture}
        onClick={setAnchor}
      />

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={clearAnchor}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
      >
        <MenuItem onClick={clickLogout}>
          <ListItemIcon>
            <Icon fontSize="small">logout</Icon>
          </ListItemIcon>
          Logout
        </MenuItem>
        <MenuItem onClick={clickSynchronize} disabled={loading}>
          <ListItemIcon>
            <Icon
              fontSize="small"
              sx={loading ? {
                animation: `${spin} 1s linear infinite`,
              } : undefined}
            >
              sync
            </Icon>
          </ListItemIcon>
          Synchronize ReadList
        </MenuItem>
      </Menu>
    </>
  );
};
