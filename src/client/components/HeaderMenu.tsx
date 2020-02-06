import React from 'react';
import {
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControlLabel,
  Icon,
  ListItem, ListItemText,
  ListSubheader,
  Menu,
  MenuItem, useTheme,
} from '@material-ui/core';
import * as colors from '@material-ui/core/colors';
import { useLazyQuery, useMutation } from '@apollo/react-hooks';

import {
  BookInfoOrder,
  DeleteUnusedFoldersMutation, DeleteUnusedFoldersMutationVariables,
  FolderSizesQuery,
  FolderSizesQueryVariables,
} from '@common/GQLTypes';
import DebugFolderSizesQuery from '@client/graphqls/App_debug_folderSizes.gql';
import DebugDeleteFolderMutation from '@client/graphqls/App_debug_deleteFolderSizes_mutation.gql';

import { useGlobalStore } from '@client/store/StoreProvider';
import { useApollo } from '@client/apollo/ApolloProvider';
import ColorTile from './ColorTile';

interface HeaderMenuProps {
  menuAnchorEl: Element;
  setMenuAnchorEl: (element: Element) => any;
}

const wrapSize = (size) => {
  if (!size || size === -1) return '0 [B]';
  const sizes = ['', 'K', 'M', 'G', 'T'];
  let index = sizes.findIndex((v, i) => size / 10 ** (i * 3) < 1) - 1;
  if (index < 0) index = sizes.length - 1;
  return `${(size / 10 ** (index * 3)).toString(10).match(/\d+(\.\d{1,2})?/)[0]} [${sizes[index]}B]`;
};

const HeaderMenu: React.FC<HeaderMenuProps> = (props: HeaderMenuProps) => {
  const {
    menuAnchorEl,
    setMenuAnchorEl,
  } = props;

  const { state: store, dispatch } = useGlobalStore();
  const { persistor } = useApollo();
  const theme = useTheme();

  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [debugAnchorEl, setDebugAnchorEl] = React.useState(null);
  const [openFolderSize, setOpenFolderSize] = React.useState(false);
  const [openCacheControl, setOpenCacheControl] = React.useState(null);

  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);
  const [colorType, setColorType] = React.useState<'primary' | 'secondary'>(undefined);

  const [getFolderSizes, { refetch, loading, data }] = useLazyQuery<
    FolderSizesQuery,
    FolderSizesQueryVariables
    >(DebugFolderSizesQuery);

  const [deleteUnusedFolder, { loading: deleteLoading }] = useMutation<
    DeleteUnusedFoldersMutation,
    DeleteUnusedFoldersMutationVariables
    >(DebugDeleteFolderMutation, {
      onCompleted() {
      // noinspection JSIgnoredPromiseFromCall
        refetch();
      },
    });

  /* i => [apollo, storage, all] */
  const purgeCache = React.useCallback((i) => {
    (i !== 1 ? persistor.purge() : Promise.resolve())
      .then(() => {
        if (store.wb && i === 1) {
          navigator.serviceWorker.addEventListener('message', () => {
            window.location.reload(true);
          });
          store.wb.messageSW({
            type: 'PURGE_CACHE',
          });
          setTimeout(() => {
            window.location.reload(true);
          }, 10 * 1000);
        } else {
          window.location.reload(true);
        }
      });
  }, [store.wb]);

  return (
    <>
      <Menu
        getContentAnchorEl={null}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={menuAnchorEl}
        open={!!menuAnchorEl}
        onClose={() => setMenuAnchorEl(null)}
      >
        <ListSubheader style={{ lineHeight: 'normal' }}>
          Show
        </ListSubheader>
        <ListItem style={{ outline: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
          {Object.entries({ normal: 'Normal', history: 'History', invisible: 'Invisible' }).map(([k, v]) => (
            <FormControlLabel
              key={k}
              control={(
                <Checkbox
                  checked={store[k]}
                  onChange={(e) => dispatch({ [k]: e.target.checked })}
                />
              )}
              label={v}
            />
          ))}
        </ListItem>
        <MenuItem onClick={(e) => setSortAnchorEl(e.currentTarget)}>
          {`Sort: ${store.sortOrder}`}
        </MenuItem>
        <MenuItem
          onClick={(e) => { setColorType('primary'); setColorAnchorEl(e.currentTarget); }}
        >
          <span>Primary:</span>
          <ColorTile marginLeft color={store.primary} />
        </MenuItem>
        <MenuItem
          onClick={(e) => { setColorType('secondary'); setColorAnchorEl(e.currentTarget); }}
        >
          <span>Secondary:</span>
          <ColorTile marginLeft color={store.secondary} />
        </MenuItem>
        <MenuItem onClick={() => dispatch({ showBookInfoName: !store.showBookInfoName })}>
          <span>{`${store.showBookInfoName ? 'Hide' : 'Show'} InfoName`}</span>
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
                  .map(([k, v]) => (
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
    </>
  );
};

export default HeaderMenu;
