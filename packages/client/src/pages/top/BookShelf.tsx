import React from 'react';
import {
  AppBar,
  Box,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import useMediaQuery from '@client/hooks/useMediaQuery';
import { useLocation, Outlet, Link } from 'react-router-dom';

const TabItems = [
  {
    title: 'Favorite',
    path: '/bookshelf',
  },
  {
    title: 'History',
    path: '/bookshelf/history',
  },
];

const BookShelf = () => {
  const theme = useTheme();
  const location = useLocation();
  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [tabIndex, setTabIndex] = React.useState(0);
  React.useEffect(() => {
    const i = TabItems.findIndex(({ path }) => location.pathname === path);
    setTabIndex(Math.max(0, i));
    // eslint-disable-next-line
  }, []);

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
              component={Link}
              replace
              to={tabItem.path}
            />
          ))}
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ py: 7 }}>
        <Outlet />
      </Box>
    </>
  );
};

export default React.memo(BookShelf);
