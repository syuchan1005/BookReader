import React, { lazy } from 'react';
import {
  BottomNavigation, BottomNavigationAction, Icon, Paper,
} from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';

const Home = lazy(() => import('@client/pages/top/Home'));
const BookShelf = lazy(() => import('@client/pages/top/BookShelf'));

const TabItems = [
  {
    title: 'Home',
    icon: 'home',
    component: Home,
  },
  {
    title: 'BookShelf',
    icon: 'bookshelf',
    component: BookShelf,
  },
];

const TabPaths = [
  '/',
  '/bookshelf',
];

const Top = () => {
  const history = useHistory();
  const location = useLocation();
  const [tabIndex, setTabIndex] = React.useState(0);

  React.useEffect(() => {
    const i = TabPaths.findIndex((p) => p !== '/' && location.pathname.startsWith(p));
    setTabIndex(Math.max(0, i));
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    if (!location.pathname.startsWith(TabPaths[tabIndex])) {
      history.replace(TabPaths[tabIndex]);
    }
    // eslint-disable-next-line
  }, [history, tabIndex]);

  const T = TabItems[tabIndex];
  return (
    <>
      <T.component />
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
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default React.memo(Top);
