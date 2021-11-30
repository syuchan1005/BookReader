import React, { lazy } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Icon,
  Paper,
} from '@mui/material';
import { useLocation, Outlet, Link } from 'react-router-dom';

const TabItems = [
  {
    title: 'Home',
    icon: 'home',
    path: '/',
  },
  {
    title: 'BookShelf',
    icon: 'bookshelf',
    path: '/bookshelf',
  },
];

const Top = () => {
  const location = useLocation();
  const [tabIndex, setTabIndex] = React.useState(0);

  React.useEffect(() => {
    const i = TabItems.findIndex(({ path }) => path !== '/' && location.pathname.startsWith(path));
    setTabIndex(Math.max(0, i));
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <Outlet />
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 'appBar',
        }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={tabIndex}
          onChange={(a, b) => setTabIndex(b)}
        >
          {TabItems.map((tab, i) => (
            <BottomNavigationAction
              key={tab.title}
              value={i}
              label={tab.title}
              icon={<Icon>{tab.icon}</Icon>}
              component={Link}
              replace
              to={tab.path}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default React.memo(Top);
