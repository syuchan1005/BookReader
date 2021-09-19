import React, { ChangeEvent, useCallback } from 'react';
import {
  AppBar,
  Icon,
  IconButton,
  InputAdornment,
  InputBase,
  Theme,
  Toolbar,
  useTheme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { alpha } from '@mui/material/styles';

import { commonTheme } from '@client/App';
import { useAppBarScrollElevation } from '@client/hooks/useAppBarScrollElevation';

interface SearchAndMenuHeaderProps {
  onClickMenuIcon?: (element: Element) => void;
  searchText?: string;
  onChangeSearchText?: (text: string) => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  appBar: {
    paddingTop: commonTheme.safeArea.top,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
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

const SearchAndMenuHeader = (props: SearchAndMenuHeaderProps) => {
  const classes = useStyles(props);
  const theme = useTheme();
  const {
    onClickMenuIcon,
    searchText,
    onChangeSearchText,
  } = props;

  const handleSearchText = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onChangeSearchText?.(event.target.value);
  }, [onChangeSearchText]);

  const clearSearchText = useCallback(() => {
    onChangeSearchText?.('');
  }, [onChangeSearchText]);

  const elevation = useAppBarScrollElevation();

  return (
    <AppBar elevation={elevation} className={classes.appBar}>
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
            endAdornment={(searchText) ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  style={{ color: theme.palette.common.white }}
                  onClick={clearSearchText}
                >
                  <Icon>clear</Icon>
                </IconButton>
              </InputAdornment>
            ) : undefined}
            value={searchText}
            onChange={handleSearchText}
          />
        </div>

        <IconButton
          className={classes.sortIcon}
          onClick={(event) => (onClickMenuIcon && onClickMenuIcon(event.currentTarget))}
          aria-label="sort"
          size="large">
          <Icon>sort</Icon>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default React.memo(SearchAndMenuHeader);
