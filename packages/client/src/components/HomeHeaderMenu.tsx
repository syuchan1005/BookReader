import React from 'react';
import {
  Button,
  Chip,
  CircularProgress,
  Collapse,
  createStyles,
  FormControl,
  Icon,
  Input,
  InputLabel,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Menu,
  MenuItem,
  Select,
  useTheme,
} from '@material-ui/core';
import * as colors from '@material-ui/core/colors';
import { useLazyQuery, useMutation, useQuery } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import {
  BookInfoOrder,
  DeleteUnusedFoldersMutation,
  DeleteUnusedFoldersMutationVariables,
  FolderSizesQuery,
  FolderSizesQueryVariables,
  GenresQuery as GenresQueryData,
  GenresQueryVariables,
} from '@syuchan1005/book-reader-graphql';
import DebugFolderSizesQuery from '@syuchan1005/book-reader-graphql/queries/App_debug_folderSizes.gql';
import DebugDeleteFolderMutation from '@syuchan1005/book-reader-graphql/queries/App_debug_deleteFolderSizes_mutation.gql';
import GenresQuery from '@syuchan1005/book-reader-graphql/queries/common/GenresQuery.gql';

import { useGlobalStore } from '@client/store/StoreProvider';
import { useApollo } from '@client/apollo/ApolloProvider';
import ColorTile from './ColorTile';

interface HeaderMenuProps {
  anchorEl: Element;
  onClose?: () => void;
}

const wrapSize = (size: number) => {
  if (!size || size === -1) return '0 [B]';
  const sizes = ['', 'K', 'M', 'G', 'T'];
  let index = sizes.findIndex((v, i) => size / 10 ** (i * 3) < 1) - 1;
  if (index < 0) index = sizes.length - 1;
  return `${(size / 10 ** (index * 3)).toString(10).match(/\d+(\.\d{1,2})?/)[0]} [${sizes[index]}B]`;
};

const useStyles = makeStyles(() => createStyles({
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  disableHover: {
    cursor: 'auto',
    '&:hover': {
      background: 'inherit',
    },
  },
}));

const HomeHeaderMenu: React.FC<HeaderMenuProps> = React.memo((props: HeaderMenuProps) => {
  const {
    anchorEl,
    onClose,
  } = props;
  const classes = useStyles(props);

  const history = useHistory();
  const { state: store, dispatch } = useGlobalStore();
  const { persistor } = useApollo();
  const theme = useTheme();

  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [debugAnchorEl, setDebugAnchorEl] = React.useState(null);
  const [openFolderSize, setOpenFolderSize] = React.useState(false);
  const [openCacheControl, setOpenCacheControl] = React.useState(null);

  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);
  const [colorType, setColorType] = React.useState<'primary' | 'secondary'>(undefined);

  const [historyAnchorEl, setHistoryAnchorEl] = React.useState(null);

  const [getFolderSizes, { refetch, loading, data }] = useLazyQuery<FolderSizesQuery,
    FolderSizesQueryVariables>(DebugFolderSizesQuery);

  const [deleteUnusedFolder, { loading: deleteLoading }] = useMutation<DeleteUnusedFoldersMutation,
    DeleteUnusedFoldersMutationVariables>(DebugDeleteFolderMutation, {
      onCompleted() {
      // noinspection JSIgnoredPromiseFromCall
        refetch();
      },
    });

  /* i => [apollo, storage, all] */
  const purgeCache = React.useCallback((i) => {
    // noinspection JSDeprecatedSymbols
    const reload = () => window.location.reload(true);
    (i !== 1 ? persistor.purge() : Promise.resolve())
      .then(() => {
        if (store.wb && i === 1) {
          navigator.serviceWorker.addEventListener('message', reload);
          store.wb.messageSW({
            type: 'PURGE_CACHE',
          });
          setTimeout(reload, 10 * 1000);
        } else {
          reload();
        }
      });
  }, [store.wb]);

  const {
    data: genreData,
  } = useQuery<GenresQueryData,
    GenresQueryVariables>(GenresQuery);

  return (
    <>
      <Menu
        getContentAnchorEl={null}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => (onClose && onClose())}
      >
        <MenuItem disableRipple disableTouchRipple className={classes.disableHover}>
          <FormControl fullWidth style={{ maxWidth: 170 }}>
            <InputLabel>Genres</InputLabel>
            <Select
              multiple
              input={<Input />}
              value={store.genres}
              onChange={(e) => dispatch({ genres: e.target.value as string[] })}
              renderValue={(selected) => (
                <div className={classes.chips}>
                  {(selected as string[]).map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      className={classes.chip}
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
        </MenuItem>
        <MenuItem onClick={(e) => setHistoryAnchorEl(e.currentTarget)}>
          History:
          {' '}
          {store.history}
        </MenuItem>
        <MenuItem onClick={(e) => setSortAnchorEl(e.currentTarget)}>
          {`Sort: ${store.sortOrder}`}
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setColorType('primary');
            setColorAnchorEl(e.currentTarget);
          }}
        >
          <span>Primary:</span>
          <ColorTile marginLeft color={store.primary} />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setColorType('secondary');
            setColorAnchorEl(e.currentTarget);
          }}
        >
          <span>Secondary:</span>
          <ColorTile marginLeft color={store.secondary} />
        </MenuItem>
        <MenuItem onClick={() => dispatch({ showBookInfoName: !store.showBookInfoName })}>
          <span>{`${store.showBookInfoName ? 'Hide' : 'Show'} InfoName`}</span>
        </MenuItem>
        <MenuItem onClick={() => history.push('/setting')}>
          <ListItemIcon><Icon>settings</Icon></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={() => setDebugAnchorEl(!debugAnchorEl)}>
          Debug
          <Icon>{`keyboard_arrow_${debugAnchorEl ? 'up' : 'down'}`}</Icon>
        </MenuItem>
        <Collapse in={debugAnchorEl}>
          <MenuItem onClick={() => setOpenCacheControl(!openCacheControl)}>
            Cache Control
            <Icon>{`keyboard_arrow_${openCacheControl ? 'up' : 'down'}`}</Icon>
          </MenuItem>
          <Collapse in={openCacheControl}>
            {['Purge apollo cache', 'Purge cacheStorage', 'Purge All'].map((order, i) => (
              <MenuItem
                key={order}
                onClick={() => purgeCache(i)}
                style={{ paddingLeft: theme.spacing(3) }}
              >
                {order}
              </MenuItem>
            ))}
          </Collapse>
          <MenuItem
            onClick={() => {
              if (!openFolderSize) getFolderSizes();
              setOpenFolderSize(!openFolderSize);
            }}
          >
            Folder sizes
            <Icon>{`keyboard_arrow_${openFolderSize ? 'up' : 'down'}`}</Icon>
          </MenuItem>
          <Collapse in={openFolderSize}>
            {(deleteLoading || loading || !data) ? (
              <MenuItem style={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress color="secondary" />
              </MenuItem>
            ) : (
              <>
                {Object.entries(data.sizes)
                  .filter(([k]) => !k.startsWith('_'))
                  .map(([k, v]: [string, number]) => (
                    <ListItem
                      key={k}
                      style={{
                        paddingLeft: theme.spacing(3),
                        paddingTop: 0,
                        paddingBottom: 0,
                      }}
                    >
                      <ListItemText primary={k} secondary={k.endsWith('Count') ? v : wrapSize(v)} />
                    </ListItem>
                  ))}
                <ListItem>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => deleteUnusedFolder()}
                  >
                    Delete Unused and Cache
                  </Button>
                </ListItem>
              </>
            )}
          </Collapse>
        </Collapse>
        <MenuItem onClick={() => window.open('https://github.com/syuchan1005/BookReader')}>
          GitHub - BookReader
        </MenuItem>
      </Menu>
      <Menu
        getContentAnchorEl={null}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={sortAnchorEl}
        open={!!sortAnchorEl}
        onClose={() => setSortAnchorEl(null)}
      >
        {Object.keys(BookInfoOrder).map((order: BookInfoOrder) => (
          <MenuItem
            key={order}
            onClick={() => {
              dispatch({ sortOrder: BookInfoOrder[order] });
              setSortAnchorEl(null);
            }}
          >
            {BookInfoOrder[order]}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={colorAnchorEl}
        open={!!colorAnchorEl && !!colorType}
        onClose={() => {
          setColorAnchorEl(null);
          setColorType(undefined);
        }}
        PaperProps={{
          style: { maxHeight: theme.spacing(7 * 5) },
        }}
      >
        {Object.keys(colors).map((c) => ((c !== 'common') ? (
          <MenuItem
            key={c}
            onClick={() => {
              dispatch({ [colorType]: c });
              setColorType(undefined);
              setColorAnchorEl(null);
            }}
          >
            <ColorTile color={c} />
          </MenuItem>
        ) : null))}
      </Menu>
      <Menu
        anchorEl={historyAnchorEl}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        open={!!historyAnchorEl}
        onClose={() => {
          setHistoryAnchorEl(null);
        }}
      >
        {['SHOW', 'HIDE', 'ALL'].map((s: 'SHOW' | 'HIDE' | 'ALL') => (
          <MenuItem
            key={s}
            onClick={() => {
              setHistoryAnchorEl(null);
              dispatch({ history: s });
            }}
          >
            {s}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

export default HomeHeaderMenu;
