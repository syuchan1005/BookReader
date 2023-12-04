import {
  AppBar,
  Chip,
  FormControl,
  Icon,
  IconButton,
  InputAdornment,
  InputBase,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Theme,
  Toolbar,
  useTheme,
} from '@mui/material';
import { red } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';

import { commonTheme } from '@client/App';
import { useAppBarScrollElevation } from '@client/hooks/useAppBarScrollElevation';
import { genresState } from '@client/store/atoms';
import {
  SearchMode,
  useAvailableSearchModesQuery,
  useGenresQuery,
} from '@syuchan1005/book-reader-graphql';
import { useRecoilState } from 'recoil';

interface SearchAndMenuHeaderProps {
  onClickMenuIcon?: (element: Element) => void;
  searchText?: string;
  searchMode: SearchMode;
  onChangeSearchText?: (text: string, searchMode: SearchMode) => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
        width: 350,
      },
    },
    sortIcon: {
      marginLeft: theme.spacing(1),
      color: 'white',
    },
    inputFilter: {
      width: '100%',
      minWidth: 200,
      [theme.breakpoints.up('sm')]: {
        width: 350,
      },
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {
      margin: 2,
    },
  }),
);

const SearchAndMenuHeader = (props: SearchAndMenuHeaderProps) => {
  const classes = useStyles(props);
  const theme = useTheme();
  const { onClickMenuIcon, searchText, searchMode, onChangeSearchText } = props;

  const { data } = useAvailableSearchModesQuery();
  // biome-ignore lint/correctness/useExhaustiveDependencies: onChangeSearchText
  const handleSearchModeChange = useCallback(
    (e) => {
      const selectedSearchMode = e.target.value;
      let mode = SearchMode.Database;
      if (Object.values(SearchMode).includes(selectedSearchMode)) {
        mode = selectedSearchMode;
      }
      onChangeSearchText?.(searchText, mode);
    },
    [searchText],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: searchMode
  const handleSearchText = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChangeSearchText?.(event.target.value, searchMode);
    },
    [onChangeSearchText],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: searchMode
  const clearSearchText = useCallback(() => {
    onChangeSearchText?.('', searchMode);
  }, [onChangeSearchText]);

  const elevation = useAppBarScrollElevation();

  const searchInputRef = useRef(null);
  const [searchFilterPopoverAnchorEl, setSearchFilterPopoverAnchorEl] =
    useState(null);
  const handleSearchFilterClick = useCallback(() => {
    setSearchFilterPopoverAnchorEl(searchInputRef.current);
  }, []);

  const { data: genreData } = useGenresQuery();
  // TODO: Update genres state in caller side
  const [genres, setGenres] = useRecoilState(genresState);
  const handleGenresChange = useCallback(
    (event) => {
      setGenres(event.target.value);
    },
    [setGenres],
  );
  const handleDeleteGenre = useCallback(
    (index) => {
      setGenres((currentGenres) => {
        const newGenres = [...currentGenres];
        newGenres.splice(index, 1);
        return newGenres;
      });
    },
    [setGenres],
  );

  const hasSearchFilter = useMemo(() => genres.length > 0, [genres.length]);

  return (
    <AppBar elevation={elevation} className={classes.appBar}>
      <Toolbar>
        <div style={{ flexGrow: 1 }} />
        <div className={classes.search}>
          <div className={classes.searchIcon}>
            <Icon>search</Icon>
          </div>
          <InputBase
            ref={searchInputRef}
            placeholder="Search…"
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            inputProps={{ 'aria-label': 'search' }}
            endAdornment={
              <InputAdornment position="end">
                {searchText && (
                  <IconButton
                    size="small"
                    style={{ color: theme.palette.common.white }}
                    onClick={clearSearchText}
                    aria-label="clear"
                  >
                    <Icon>clear</Icon>
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  style={{
                    color: hasSearchFilter
                      ? red['600']
                      : theme.palette.common.white,
                  }}
                  onClick={handleSearchFilterClick}
                  aria-label="filter genres"
                >
                  <Icon>filter_list</Icon>
                </IconButton>
              </InputAdornment>
            }
            value={searchText}
            onChange={handleSearchText}
          />
        </div>

        <Popover
          open={Boolean(searchFilterPopoverAnchorEl)}
          anchorEl={searchFilterPopoverAnchorEl}
          onClose={() => setSearchFilterPopoverAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: { p: 1, display: 'flex', flexDirection: 'column' },
          }}
        >
          <FormControl
            fullWidth
            margin="dense"
            size="small"
            className={classes.inputFilter}
          >
            <InputLabel>SearchMode</InputLabel>
            <Select
              label="SearchMode"
              margin="dense"
              value={searchMode}
              onChange={handleSearchModeChange}
            >
              {(data?.availableSearchModes ?? ['DATABASE']).map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" className={classes.inputFilter}>
            <InputLabel>Genre</InputLabel>
            <Select
              multiple
              label="Genre"
              margin="dense"
              value={genres}
              onChange={handleGenresChange}
              renderValue={(selected) => (
                <div className={classes.chips}>
                  {(selected as string[]).map((value, i) => (
                    <Chip
                      key={value}
                      label={value}
                      className={classes.chip}
                      // This is a trick to enable onDelete inside the Select component.
                      // https://stackoverflow.com/q/59522767
                      onMouseDown={(e) => e.stopPropagation()}
                      onDelete={() => handleDeleteGenre(i)}
                    />
                  ))}
                </div>
              )}
            >
              {(genreData?.genres?.map((g) => g.name) ?? []).map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Popover>

        <IconButton
          className={classes.sortIcon}
          onClick={(event) => onClickMenuIcon?.(event.currentTarget)}
          aria-label="sort"
          size="large"
        >
          <Icon>sort</Icon>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default SearchAndMenuHeader;
