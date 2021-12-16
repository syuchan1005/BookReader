import React from 'react';
import {
  Avatar, Icon, IconButton, ListItemIcon, Menu, MenuItem, Tooltip,
} from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { useRecoilValue } from 'recoil';
import { hasAuth0State } from '@client/store/atoms';
import useMenuAnchor from '@client/hooks/useMenuAnchor';

export const UserMenuButton = () => {
  const {
    loginWithRedirect,
    isAuthenticated,
    logout: logoutAuth0,
    user,
  } = useAuth0();
  const logout = React.useCallback(() => {
    logoutAuth0({ returnTo: window.location.origin });
  }, [logoutAuth0]);
  const hasAuth0 = useRecoilValue(hasAuth0State);
  const [anchor, setAnchor, clearAnchor] = useMenuAnchor();

  if (!hasAuth0) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Tooltip title="Login">
        <IconButton sx={{ color: 'common.white' }} onClick={() => loginWithRedirect()}>
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
        onClick={clearAnchor}
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
        <MenuItem onClick={() => logout()}>
          <ListItemIcon>
            <Icon fontSize="small">logout</Icon>
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};
