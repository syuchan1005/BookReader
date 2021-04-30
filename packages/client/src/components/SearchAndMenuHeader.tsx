import React from 'react';
import {
  AppBar,
  createStyles,
  Icon,
  IconButton,
  InputAdornment,
  InputBase,
  makeStyles,
  Theme,
  Toolbar,
  useTheme,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';

import { useGlobalStore } from '@client/store/StoreProvider';
import { commonTheme } from '@client/App';

interface SearchAndMenuHeaderProps {
  onClickMenuIcon?: (element: Element) => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  appBar: {
    paddingTop: commonTheme.safeArea.top,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    color: theme.palette.common.white,
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    },
  },
  sortIcon: {
    marginLeft: theme.spacing(1),
    color: 'white',
  },
}));

const SearchAndMenuHeader: React.FC<SearchAndMenuHeaderProps> = (
  props: SearchAndMenuHeaderProps,
) => {
  const classes = useStyles(props);
  const { state: store, dispatch } = useGlobalStore();
  const theme = useTheme();
  const {
    onClickMenuIcon,
  } = props;

  return (
    <AppBar className={classes.appBar}>
      <Toolbar>
        <div style={{ flexGrow: 1 }} />
        <div className={classes.search}>
          <div className={classes.searchIcon}>
            <Icon>search</Icon>
          </div>
          <InputBase
            placeholder="Search…"
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            inputProps={{ 'aria-label': 'search' }}
            endAdornment={(store.searchText) ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  style={{ color: theme.palette.common.white }}
                  onClick={() => {
                    dispatch({ searchText: '' });
                  }}
                >
                  <Icon>clear</Icon>
                </IconButton>
              </InputAdornment>
            ) : undefined}
            value={store.searchText}
            onChange={(e) => {
              dispatch({ searchText: e.target.value });
            }}
          />
        </div>

        <IconButton
          size="small"
          className={classes.sortIcon}
          onClick={(event) => (onClickMenuIcon && onClickMenuIcon(event.currentTarget))}
          aria-label="sort"
        >
          <Icon>sort</Icon>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default SearchAndMenuHeader;
