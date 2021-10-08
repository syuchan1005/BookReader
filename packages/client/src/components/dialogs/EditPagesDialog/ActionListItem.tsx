import React from 'react';
import {
  Button,
  Card,
  FormControl,
  FormControlLabel,
  FormLabel,
  Icon,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  useTheme,
} from '@mui/material';

import { EditType, SplitType } from '@syuchan1005/book-reader-graphql';
import IntRangeInputField from '@client/components/IntRangeInputField';
import FileField from '@client/components/FileField';
import CalcImagePaddingDialog, {
  calcPadding,
  urlToImageData,
} from '@client/components/dialogs/CalcImagePaddingDialog';
import { createBookPageUrl } from '@client/components/BookPageImage';

interface ListItemProps {
  draggableProps: any;
  dragHandleProps?: any;

  bookId: string;
  content: { [key: string]: any };
  setContent: (key: string, content: any) => void;
  maxPage: number;
  onDelete: () => void;
}

interface ListItemCardProps extends ListItemProps {
  ref: React.ForwardedRef<unknown>;
  menuText: string;

  children?: React.ReactNode;
}

export const createInitValue = (editType: EditType) => {
  switch (editType) {
    case EditType.Crop:
      return {
        pageRange: [],
        left: 0,
        right: 0,
      };
    case EditType.Replace:
    case EditType.Put:
      return {
        pageIndex: 1,
        image: undefined,
      };
    case EditType.Delete:
      return {
        pageRange: [],
      };
    case EditType.Split:
      return {
        pageRange: [],
        splitType: SplitType.Vertical,
      };
    default:
      return {};
  }
};

const ListItemCard = React.forwardRef((props: ListItemCardProps, ref) => {
  const {
    draggableProps,
    dragHandleProps,
    menuText,
    onDelete,
    children,
  } = props;
  const theme = useTheme();
  return (
    <ListItem
      // @ts-ignore
      ref={ref}
      {...draggableProps}
      style={{
        zIndex: theme.zIndex.modal + 1,
        // @ts-ignore
        ...(draggableProps.style),
        flexWrap: 'wrap',
      }}
    >
      <Card
        variant="outlined"
        style={{
          width: '100%',
          padding: theme.spacing(1),
        }}
      >
        <ListItem disableGutters ContainerComponent="div" style={{ paddingTop: 0 }}>
          <ListItemIcon><Icon {...dragHandleProps}>menu</Icon></ListItemIcon>
          <ListItemText primary={menuText} />
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={onDelete} size="large">
              <Icon>delete</Icon>
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        {children}
      </Card>
    </ListItem>
  );
});

const ListItems = {
  [EditType.Crop]: React.forwardRef((props: ListItemProps, ref) => {
    const {
      maxPage,
      content,
      setContent,
      bookId,
    } = props;
    const theme = useTheme();
    const [isOpen, setOpen] = React.useState(false);
    return (
      <ListItemCard ref={ref} {...props} menuText="Crop">
        <IntRangeInputField
          initValue={content.pageRange || []}
          onChange={(r) => setContent('pageRange', r)}
          maxPage={maxPage}
        />
        {['Left', 'Right'].map((label) => (
          <TextField
            key={label}
            label={label}
            color="secondary"
            type="number"
            value={content[label.toLowerCase()]}
            onChange={(e) => setContent(label.toLowerCase(), Number(e.target.value))}
          />
        ))}
        <Button
          fullWidth
          variant="outlined"
          style={{ marginTop: theme.spacing(1) }}
          onClick={() => setOpen(true)}
        >
          Detect padding
        </Button>
        <CalcImagePaddingDialog
          bookId={bookId}
          open={isOpen}
          onClose={() => setOpen(false)}
          maxPage={maxPage}
          left={content.left ?? 0}
          right={content.right ?? 0}
          onSizeChange={(left: number, right: number) => {
            setContent('left', left);
            setContent('right', right);
          }}
        />
      </ListItemCard>
    );
  }),
  [EditType.Replace]: React.forwardRef((props: ListItemProps, ref) => {
    const {
      maxPage,
      content,
      setContent,
    } = props;
    return (
      <ListItemCard ref={ref} {...props} menuText="Replace">
        <TextField
          type="number"
          label={`page (max: ${maxPage})`}
          color="secondary"
          value={content.pageIndex}
          onChange={(e) => setContent('pageIndex', Number(e.target.value))}
        />
        <FileField
          file={content.image}
          onChange={(f) => setContent('image', f)}
        />
      </ListItemCard>
    );
  }),
  [EditType.Delete]: React.forwardRef((props: ListItemProps, ref) => {
    const {
      maxPage,
      content,
      setContent,
    } = props;
    return (
      <ListItemCard ref={ref} {...props} menuText="Delete">
        <IntRangeInputField
          initValue={content.pageRange || []}
          onChange={(r) => setContent('pageRange', r)}
          maxPage={maxPage}
          fullWidth
        />
      </ListItemCard>
    );
  }),
  [EditType.Put]: React.forwardRef((props: ListItemProps, ref) => {
    const {
      maxPage,
      content,
      setContent,
    } = props;
    return (
      <ListItemCard ref={ref} {...props} menuText="Put">
        <TextField
          type="number"
          label={`page (max: ${maxPage})`}
          color="secondary"
          value={content.pageIndex}
          onChange={(e) => setContent('pageIndex', Number(e.target.value))}
        />
        <FileField
          file={content.image}
          onChange={(f) => setContent('image', f)}
        />
      </ListItemCard>
    );
  }),
  [EditType.Split]: React.forwardRef((props: ListItemProps, ref) => {
    const {
      maxPage,
      content,
      setContent,
    } = props;
    const theme = useTheme();
    return (
      <ListItemCard ref={ref} {...props} menuText="Split">
        <IntRangeInputField
          initValue={content.pageRange || []}
          onChange={(r) => setContent('pageRange', r)}
          maxPage={maxPage}
        />
        <FormControl
          component="fieldset"
          color="secondary"
          style={{ marginLeft: theme.spacing(1) }}
        >
          <FormLabel component="legend">SplitType</FormLabel>
          <RadioGroup
            value={content.splitType}
            onChange={(e) => setContent('splitType', e.target.value)}
          >
            <FormControlLabel control={<Radio />} value={SplitType.Vertical} label="Vertical" />
            <FormControlLabel control={<Radio />} value={SplitType.Horizontal} label="Horizontal" />
          </RadioGroup>
        </FormControl>
      </ListItemCard>
    );
  }),
};

const UnknownListItem = React.forwardRef((props: ListItemProps, ref) => (
  <ListItemCard ref={ref} {...props} menuText="Unknown" />));

interface AddItemListItemProps {
  onAdded: (editType: EditType) => void;
}

export const AddItemListItem = React.memo((props: AddItemListItemProps) => {
  const { onAdded } = props;
  const [anchorEl, setAnchorEl] = React.useState(null);
  return (
    <>
      <ListItem onClick={(e) => setAnchorEl(e.currentTarget)} button>
        <ListItemIcon><Icon>add</Icon></ListItemIcon>
        <ListItemText primary="Add Action" />
      </ListItem>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {Object.keys(ListItems)
          .map((editType: EditType) => (
            <MenuItem
              key={editType}
              onClick={() => {
                onAdded(editType);
                setAnchorEl(null);
              }}
            >
              {editType}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
});

const getPadding = async (
  bookId: string,
  maxPage: number,
  pageIndex: number,
  threshold: number,
): Promise<{ left: number, right: number }> => {
  const coverUrl = createBookPageUrl(bookId, pageIndex, maxPage);
  const coverImageData = await urlToImageData(coverUrl);
  return calcPadding(coverImageData, threshold);
};

export interface EditTypeContent {
  id: string,
  editType: EditType
  content: { [key: string]: any };
}

// noinspection JSUnusedGlobalSymbols
const Templates = {
  PaddingOnCoverAndContents: async (
    bookId: string,
    maxPage: number,
    coverIndex: number = 0,
    contentPaddingPage: number = 4,
  ): Promise<EditTypeContent[]> => {
    const [coverPadding, contentsPadding] = await Promise.all([
      getPadding(bookId, maxPage, coverIndex, 200),
      getPadding(bookId, maxPage, contentPaddingPage, 10),
    ]);
    return [
      {
        id: `${Date.now()}${Math.random()}`,
        editType: EditType.Crop,
        content: {
          pageRange: [coverIndex],
          ...coverPadding,
        },
      },
      {
        id: `${Date.now()}${Math.random()}`,
        editType: EditType.Crop,
        content: {
          pageRange: [[1, maxPage - 1]],
          ...contentsPadding,
        },
      },
      {
        id: `${Date.now()}${Math.random()}`,
        editType: EditType.Split,
        content: {
          pageRange: [[1, maxPage - 1]],
          splitType: SplitType.Vertical,
        },
      },
    ];
  },
};

interface AddTemplateListItemProps {
  bookId: string;
  maxPage: number;
  onAdded: (editTypeContents: EditTypeContent[]) => void;
}

export const AddTemplateListItem = React.memo(
  (props: AddTemplateListItemProps) => {
    const {
      bookId,
      maxPage,
      onAdded,
    } = props;
    const [anchorEl, setAnchorEl] = React.useState(null);
    return (
      <>
        <ListItem onClick={(e) => setAnchorEl(e.currentTarget)} button>
          <ListItemIcon><Icon>add</Icon></ListItemIcon>
          <ListItemText primary="Use Template" />
        </ListItem>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
          {Object.keys(Templates)
            .map((key: string) => (
              <MenuItem
                key={key}
                onClick={async () => {
                  const editContents = await Templates[key](bookId, maxPage);
                  onAdded(editContents);
                  setAnchorEl(null);
                }}
              >
                {key}
              </MenuItem>
            ))}
        </Menu>
      </>
    );
  },
);

interface ActionListItemProps extends ListItemProps {
  ref: React.ForwardedRef<unknown>;
  editType?: EditType;
}

export const ActionListItem = React.memo(
  React.forwardRef(
    (props: ActionListItemProps, ref) => {
      const {
        editType,
        ...forwardProps
      } = props;
      const Item = ListItems[editType] ?? UnknownListItem;
      return <Item ref={ref} {...forwardProps} />;
    },
  ),
);
