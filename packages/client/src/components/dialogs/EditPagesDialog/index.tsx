import React from 'react';
import {
  Box,
  Button, CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText, Typography,
} from '@mui/material';
import { List as MovableList, arrayMove } from 'react-movable';

import {
  useBulkEditPageProgressSubscription,
  useBulkEditPagesMutation,
} from '@syuchan1005/book-reader-graphql';
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
  onSuccess: () => void;
}

const EditPagesDialog = (props: EditPagesDialogProps) => {
  const {
    open,
    onClose,
    maxPage,
    bookId,
    onSuccess,
  } = props;
  const [actions, setActions] = React.useState<(EditTypeContent | undefined)[]>([]);
  const [subscriptionId, setSubscriptionId] = React.useState<string>(undefined);

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

  const [doBulkEditPages, { loading }] = useBulkEditPagesMutation({
    onCompleted(data) {
      setSubscriptionId(undefined);
      if (data.bulkEditPage.success) {
        onSuccess();
      }
    },
  });

  const handleEdit = React.useCallback(() => {
    setSubscriptionId(bookId);
    doBulkEditPages({
      variables: {
        bookId,
        editActions: actions.map((action) => ({
          editType: action.editType,
          [action.editType.toLowerCase()]: action.content,
        })),
      },
    });
  }, [actions, bookId, doBulkEditPages]);

  const { data: subscriptionData } = useBulkEditPageProgressSubscription({
    skip: !subscriptionId,
    variables: {
      bookId: subscriptionId,
    },
  });

  return (
    <Dialog open={open} fullWidth>
      <DialogTitle>Edit Pages</DialogTitle>

      {/* eslint-disable-next-line no-nested-ternary */}
      {(loading) ? (
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <CircularProgress color="secondary" size={50} />
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            {subscriptionData?.bulkEditPage}
          </Typography>
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
