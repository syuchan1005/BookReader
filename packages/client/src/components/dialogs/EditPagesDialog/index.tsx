import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import { useBulkEditPagesMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import LoadingFullscreen from '@client/components/LoadingFullscreen';
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

  const handleOnDragEnd = React.useCallback((result) => {
    setActions((a) => {
      const items = Array.from(a);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      return items;
    });
  }, []);

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
        new Promise((r) => setTimeout(r, 1000)), // timeout: 1000ms
      ]),
    ]).finally(() => window.location.reload());
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
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="editTypes">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {(actions.length === 0) ? (
                <>
                  <AddTemplateListItem
                    bookId={bookId}
                    maxPage={maxPage}
                    onAdded={setActions}
                  />
                  <ListItem>
                    <ListItemText primary="or" style={{ textAlign: 'center' }} />
                  </ListItem>
                </>
              ) : (
                <>
                  {actions.map((ctx, index) => (
                    <Draggable key={ctx.id} draggableId={ctx.id} index={index}>
                      {(providedInner) => (
                        // @ts-ignore
                        <ActionListItem
                          ref={providedInner.innerRef}
                          editType={ctx.editType}
                          maxPage={maxPage}
                          bookId={bookId}
                          content={ctx.content}
                          setContent={(k, c) => setContentValue(index, k, c)}
                          onDelete={() => handleDeleteAction(index)}
                          {...providedInner}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </>
              )}
              <AddItemListItem onAdded={(editType) => {
                setActions([
                  ...actions,
                  {
                    id: uuidv4(),
                    editType,
                    content: createInitValue(editType),
                  },
                ]);
              }}
              />
            </List>
          )}
        </Droppable>
      </DragDropContext>
      <DialogActions>
        <Button
          onClick={() => {
            onClose();
            setActions([]);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleEdit}
          disabled={actions.length === 0}
        >
          Edit
        </Button>
        <LoadingFullscreen open={loading} />
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(EditPagesDialog);
