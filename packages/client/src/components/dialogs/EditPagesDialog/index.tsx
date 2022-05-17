import React from 'react';
import {
  Box,
  Button, CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { List as MovableList, arrayMove } from 'react-movable';

import { useBulkEditPagesMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import { resetStore } from '@client/apollo';
import { workbox } from '@client/registerServiceWorker';
import {
  ActionListItem, AddItemListItem,
  AddTemplateListItem, createInitValue,
  EditTypeContent,
} from './ActionListItem';

interface EditPagesDialogProps {
  open: boolean;
  onClose: () => void;
  maxPage: number;
  bookId: string;
}

const EditPagesDialog = (props: EditPagesDialogProps) => {
  const {
    open,
    onClose,
    maxPage,
    bookId,
  } = props;
  const [actions, setActions] = React.useState<(EditTypeContent | undefined)[]>([]);

  const handleDeleteAction = React.useCallback((index: number) => {
    setActions((a) => {
      const items = Array.from(a);
      items.splice(index, 1);
      return items;
    });
  }, []);

  const setContentValue = React.useCallback((actionIndex, key, c) => {
    setActions((a) => {
      const items = Array.from(a);
      items[actionIndex].content[key] = c;
      return items;
    });
  }, []);

  const reload = React.useCallback(() => {
    Promise.all([
      resetStore(),
      Promise.race([
        (workbox ? workbox.messageSW({ type: 'PURGE_CACHE' }) : Promise.resolve()),
        new Promise((r) => {
          setTimeout(r, 1000);
        }), // timeout: 1000ms
      ]),
    ])
      .finally(() => window.location.reload());
  }, []);

  const [doBulkEditPages, { loading }] = useBulkEditPagesMutation({
    onCompleted(data) {
      if (data.bulkEditPage.success) {
        reload();
      }
    },
  });

  const handleEdit = React.useCallback(() => doBulkEditPages({
    variables: {
      bookId,
      editActions: actions.map((action) => ({
        editType: action.editType,
        [action.editType.toLowerCase()]: action.content,
      })),
    },
  }), [actions, bookId, doBulkEditPages]);

  return (
    <Dialog open={open} fullWidth>
      <DialogTitle>Edit Pages</DialogTitle>

      {/* eslint-disable-next-line no-nested-ternary */}
      {(loading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress color="secondary" size={50} />
        </Box>
      ) : (
        (actions.length === 0) ? (
          <List>
            <AddTemplateListItem
              bookId={bookId}
              maxPage={maxPage}
              onAdded={setActions}
            />
            <ListItem>
              <ListItemText primary="or" style={{ textAlign: 'center' }} />
            </ListItem>
            <AddItemListItem onAdded={(editType) => {
              setActions([
                ...actions,
                {
                  id: `${Date.now()}`,
                  editType,
                  content: createInitValue(editType),
                },
              ]);
            }}
            />
          </List>
        ) : (
          <>
            <MovableList
              transitionDuration={150}
              values={actions}
              onChange={({
                oldIndex,
                newIndex,
              }) => setActions(
                arrayMove(actions, oldIndex, newIndex),
              )}
              renderList={({
                children,
                props: listProps,
              }) => (
                <List {...listProps}>
                  {children}
                </List>
              )}
              renderItem={({
                value,
                index,
                props: itemProps,
              }) => (
                <ActionListItem
                  key={value.id}
                  draggableProps={itemProps}
                  dragHandleProps={{ 'data-movable-handle': true }}
                  editType={value.editType}
                  maxPage={maxPage}
                  bookId={bookId}
                  content={value.content}
                  setContent={(k, c) => setContentValue(index, k, c)}
                  onDelete={() => handleDeleteAction(index)}
                />
              )}
            />
            <AddItemListItem onAdded={(editType) => {
              setActions([
                ...actions,
                {
                  id: `${Date.now()}`,
                  editType,
                  content: createInitValue(editType),
                },
              ]);
            }}
            />
          </>
        )
      )}

      <DialogActions>
        <Button
          onClick={() => {
            onClose();
            setActions([]);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleEdit}
          disabled={actions.length === 0 || loading}
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(EditPagesDialog);
