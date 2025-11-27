import { useQuery } from '@apollo/client/react';
import { commonTheme } from '@client/App';
import { useAppBarScrollElevation } from '@client/hooks/useAppBarScrollElevation';
import { genresState } from '@client/store/atoms';
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
  Toolbar,
  useTheme,
} from '@mui/material';
import { red } from '@mui/material/colors';
import { alpha, styled } from '@mui/material/styles';
import {
  AvailableSearchModesDocument,
  GenresDocument,
  SearchMode,
} from '@syuchan1005/book-reader-graphql';
import { useAtom } from 'jotai';
import {
  type ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

const PREFIX = 'SearchAndMenuHeader';

const classes = {
  appBar: `${PREFIX}-appBar`,
  search: `${PREFIX}-search`,
  searchIcon: `${PREFIX}-searchIcon`,
  inputRoot: `${PREFIX}-inputRoot`,
  inputInput: `${PREFIX}-inputInput`,
  sortIcon: `${PREFIX}-sortIcon`,
  inputFilter: `${PREFIX}-inputFilter`,
  chips: `${PREFIX}-chips`,
  chip: `${PREFIX}-chip`,
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  [`&.${classes.appBar}`]: {
    paddingTop: commonTheme.safeArea.top,
  },

  [`& .${classes.search}`]: {
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

  [`& .${classes.searchIcon}`]: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.inputRoot}`]: {
    color: 'inherit',
    width: '100%',
  },

  [`& .${classes.inputInput}`]: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 350,
    },
  },

  [`& .${classes.sortIcon}`]: {
    marginLeft: theme.spacing(1),
    color: 'white',
  },

  [`& .${classes.inputFilter}`]: {
    width: '100%',
    minWidth: 200,
    [theme.breakpoints.up('sm')]: {
      width: 350,
    },
  },

  [`& .${classes.chips}`]: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  [`& .${classes.chip}`]: {
    margin: 2,
  },
}));

interface SearchAndMenuHeaderProps {
  onClickMenuIcon?: (element: Element) => void;
  searchText?: string;
  searchMode: SearchMode;
  onChangeSearchText?: (text: string, searchMode: SearchMode) => void;
}

const SearchAndMenuHeader = (props: SearchAndMenuHeaderProps) => {
  const theme = useTheme();
  const { onClickMenuIcon, searchText, searchMode, onChangeSearchText } = props;

  const { data } = useQuery(AvailableSearchModesDocument);
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

  const { data: genreData } = useQuery(GenresDocument);
  // TODO: Update genres state in caller side
  const [genres, setGenres] = useAtom(genresState);
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
    <StyledAppBar elevation={elevation} className={classes.appBar}>
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
    </StyledAppBar>
  );
};

export default SearchAndMenuHeader;
