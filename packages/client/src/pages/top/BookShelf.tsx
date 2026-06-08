import {
  Box,
  Button,
  Icon,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SafeAreaAppBar } from '@client/components/SafeAreaAppBar';

const BookShelf = () => {
  const theme = useTheme();
  const location = useLocation();
  const isHistory = location.pathname.startsWith('/bookshelf/history');

  return (
    <>
      <SafeAreaAppBar sx={{ color: theme.palette.common.white }}>
        <Toolbar>
          {isHistory && (
            <IconButton
              component={Link}
              to="/bookshelf"
              size="large"
              color="inherit"
              sx={{ mr: 2 }}
            >
              <Icon>arrow_back</Icon>
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isHistory ? 'History' : 'BookShelf'}
          </Typography>
          {!isHistory && (
            <Button color="inherit" component={Link} to="/bookshelf/history">
              History
            </Button>
          )}
        </Toolbar>
      </SafeAreaAppBar>
      <Box component="main">
        <Outlet />
      </Box>
    </>
  );
};

export default BookShelf;
