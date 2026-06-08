import { useQuery } from '@apollo/client/react';
import { genresState } from '@client/store/atoms';
import {
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
import { GenresDocument } from '@syuchan1005/book-reader-graphql';
import { useAtom } from 'jotai';
import { useCallback, useMemo, useRef, useState } from 'react';
import { SafeAreaAppBar } from '@client/components/SafeAreaAppBar';

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

const StyledAppBar = styled(SafeAreaAppBar)(({ theme }) => ({
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
  onChangeSearchText?: (text: string) => void;
}

const SearchAndMenuHeader = (props: SearchAndMenuHeaderProps) => {
  const theme = useTheme();
  const { onClickMenuIcon, searchText, onChangeSearchText } = props;

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
    <StyledAppBar className={classes.appBar}>
      <Toolbar>
        <div style={{ flexGrow: 1 }} />

        {/* Search Bar */}
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
                    onClick={() => onChangeSearchText?.('')}
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
            onChange={(event) => onChangeSearchText?.(event.target.value)}
          />
        </div>

        {/* Genre Selection Popover */}
        <Popover
          open={Boolean(searchFilterPopoverAnchorEl)}
          anchorEl={searchFilterPopoverAnchorEl}
          onClose={() => setSearchFilterPopoverAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 250,
            },
          }}
        >
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

        {/* Sort Button */}
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
