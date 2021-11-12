import React from 'react';
import {
  AppBar,
  Box,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import useMediaQuery from '@client/hooks/useMediaQuery';
import { useHistory, useLocation } from 'react-router-dom';

const Favorite = React.lazy(() => import('@client/pages/top/bookshelf/Favorite'));
const History = React.lazy(() => import('@client/pages/top/bookshelf/History'));

const TabItems = [
  {
    title: 'Favorite',
    component: Favorite,
  },
  {
    title: 'History',
    component: History,
  },
];

const TabPaths = [
  '/bookshelf',
  '/bookshelf/history',
];

const BookShelf = () => {
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [tabIndex, setTabIndex] = React.useState(0);
  React.useEffect(() => {
    const i = TabPaths.findIndex((p) => location.pathname === p);
    setTabIndex(Math.max(0, i));
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    history.replace(TabPaths[tabIndex]);
  }, [history, tabIndex]);

  const T = TabItems[tabIndex];
  return (
    <>
      <AppBar sx={{ color: theme.palette.common.white }}>
        <Tabs
          value={tabIndex}
          onChange={(e, value) => setTabIndex(value)}
          centered={downXs}
          variant={downXs ? 'fullWidth' : 'standard'}
          textColor="inherit"
          indicatorColor="secondary"
        >
          {TabItems.map((tabItem, index) => (
            <Tab
              sx={{ typography: 'h6' }}
              key={tabItem.title}
              value={index}
              label={tabItem.title}
            />
          ))}
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ py: 7 }}>
        <T.component />
      </Box>
    </>
  );
};

export default React.memo(BookShelf);
