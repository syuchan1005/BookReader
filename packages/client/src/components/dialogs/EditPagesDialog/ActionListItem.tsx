import { createBookPageUrl } from '@client/components/BookPageImage';
import CropImageDialog from '@client/components/dialogs/EditPagesDialog/CropImageDialog';
import FileField from '@client/components/FileField';
import IntRangeInputField from '@client/components/IntRangeInputField';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Icon,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { EditType, SplitType } from '@syuchan1005/book-reader-graphql';
import {
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import CalcImagePaddingDialog, {
  calcPadding,
  urlToImageData,
} from './CalcImagePaddingDialog';

interface ListItemProps {
  // biome-ignore lint/suspicious/noExplicitAny: TODO
  draggableProps: any;
  // biome-ignore lint/suspicious/noExplicitAny: TODO
  dragHandleProps?: any;

  bookId: string;
  // biome-ignore lint/suspicious/noExplicitAny: TODO
  content: { [key: string]: any };
  // biome-ignore lint/suspicious/noExplicitAny: TODO
  setContent: (key: string, content: any) => void;
  maxPage: number;
  onDelete: () => void;
}

interface ListItemCardProps extends ListItemProps {
  ref: ForwardedRef<unknown>;
  menuText: string;

  children?: ReactNode;
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
        pageIndex: 0,
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
    case EditType.HStack:
      return {
        pageRange: [],
      };
    default:
      return {};
  }
};

const ListItemCard = forwardRef((props: ListItemCardProps, ref) => {
  const { draggableProps, dragHandleProps, menuText, onDelete, children } =
    props;
  const theme = useTheme();
  return (
    <ListItem
      ref={ref}
      {...draggableProps}
      style={{
        zIndex: theme.zIndex.modal + 1,
        ...draggableProps.style,
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
        <ListItem
          disableGutters
          ContainerComponent="div"
          style={{ paddingTop: 0 }}
        >
          <ListItemIcon>
            <Icon {...dragHandleProps}>menu</Icon>
          </ListItemIcon>
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
  [EditType.Crop]: forwardRef((props: ListItemProps, ref) => {
    const { maxPage, content, setContent, bookId } = props;
    const theme = useTheme();
    const [isOpen, setOpen] = useState(false);
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
            onChange={(e) =>
              setContent(label.toLowerCase(), Number(e.target.value))
            }
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
  [EditType.Replace]: forwardRef((props: ListItemProps, ref) => {
    const { maxPage, content, setContent } = props;
    return (
      <ListItemCard ref={ref} {...props} menuText="Replace">
        <TextField
          type="number"
          label={`page (max: ${maxPage})`}
          color="secondary"
          value={content.pageIndex + 1}
          onChange={(e) => setContent('pageIndex', Number(e.target.value) - 1)}
        />
        <FileField
          file={content.image}
          onChange={(f) => setContent('image', f)}
        />
      </ListItemCard>
    );
  }),
  [EditType.Delete]: forwardRef((props: ListItemProps, ref) => {
    const { maxPage, content, setContent } = props;
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
  [EditType.Put]: forwardRef((props: ListItemProps, ref) => {
    const { bookId, maxPage, content, setContent } = props;

    const [isOpen, setOpen] = useState(false);

    return (
      <ListItemCard ref={ref} {...props} menuText="Put">
        <TextField
          type="number"
          label={`page (max: ${maxPage})`}
          color="secondary"
          value={content.pageIndex + 1}
          onChange={(e) => setContent('pageIndex', Number(e.target.value) - 1)}
        />
        <Box>
          <Typography component="span" variant="subtitle1">
            {content.image ? 'Selected' : 'Not selected'}
          </Typography>
          <FileField
            acceptType="image"
            onChange={(f) => setContent('image', f)}
          />
          <span>or</span>
          <Button sx={{ m: 1 }} onClick={() => setOpen(true)}>
            Crop image
          </Button>
          <CropImageDialog
            open={isOpen}
            onClose={(blob) => {
              setOpen(false);
              if (blob) {
                setContent('image', blob);
              }
            }}
            bookId={bookId}
            maxPage={maxPage}
          />
        </Box>
      </ListItemCard>
    );
  }),
  [EditType.Split]: forwardRef((props: ListItemProps, ref) => {
    const { maxPage, content, setContent } = props;
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
            <FormControlLabel
              control={<Radio />}
              value={SplitType.Vertical}
              label="Vertical"
            />
            <FormControlLabel
              control={<Radio />}
              value={SplitType.Horizontal}
              label="Horizontal"
            />
          </RadioGroup>
        </FormControl>
      </ListItemCard>
    );
  }),
  [EditType.HStack]: forwardRef((props: ListItemProps, ref) => {
    const { maxPage, content, setContent } = props;
    return (
      <ListItemCard ref={ref} {...props} menuText="HStack">
        <IntRangeInputField
          initValue={content.pageRange || []}
          onChange={(r) => setContent('pageRange', r)}
          maxPage={maxPage}
          fullWidth
        />
      </ListItemCard>
    );
  }),
};

const UnknownListItem = forwardRef((props: ListItemProps, ref) => (
  <ListItemCard ref={ref} {...props} menuText="Unknown" />
));

interface AddItemListItemProps {
  onAdded: (editType: EditType) => void;
}

export const AddItemListItem = (props: AddItemListItemProps) => {
  const { onAdded } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <>
      <ListItemButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <ListItemIcon>
          <Icon>add</Icon>
        </ListItemIcon>
        <ListItemText primary="Add Action" />
      </ListItemButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {Object.keys(ListItems).map((editType: EditType) => (
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
};

const getPadding = async (
  bookId: string,
  maxPage: number,
  pageIndex: number,
  threshold: number,
): Promise<{ left: number; right: number }> => {
  const coverUrl = createBookPageUrl(bookId, pageIndex, maxPage);
  const coverImageData = await urlToImageData(coverUrl);
  return calcPadding(coverImageData, threshold, 150, 10, false);
};

export interface EditTypeContent {
  id: string;
  editType: EditType;
  // biome-ignore lint/suspicious/noExplicitAny: TODO
  content: { [key: string]: any };
}

const Templates: {
  name: string;
  initOptions: (maxPage: number) => Record<string, number>;
  exec: (
    bookId: string,
    maxPage: number,
    options: Record<string, number>,
  ) => Promise<EditTypeContent[]>;
}[] = [
  {
    name: 'PaddingOnCover',
    initOptions: () => ({}),
    exec: async (
      bookId: string,
      maxPage: number,
    ): Promise<EditTypeContent[]> => {
      const coverPadding = await getPadding(bookId, maxPage, 0, 200);
      return [
        {
          id: `${Date.now()}${Math.random()}`,
          editType: EditType.Crop,
          content: {
            pageRange: [0],
            ...coverPadding,
          },
        },
      ];
    },
  },
  {
    name: 'PaddingOnCoverAndContents',
    initOptions: (maxPage) => ({
      coverIndex: 1,
      contentPaddingPage: 5,
      contentEndPage: maxPage,
    }),
    exec: async (
      bookId: string,
      maxPage: number,
      options,
    ): Promise<EditTypeContent[]> => {
      const [coverPadding, contentsPadding] = await Promise.all([
        getPadding(bookId, maxPage, options.coverIndex - 1, 200),
        getPadding(bookId, maxPage, options.contentPaddingPage - 1, 50),
      ]);
      return [
        {
          id: `${Date.now()}${Math.random()}`,
          editType: EditType.Crop,
          content: {
            pageRange: [options.coverIndex - 1],
            ...coverPadding,
          },
        },
        {
          id: `${Date.now()}${Math.random()}`,
          editType: EditType.Crop,
          content: {
            pageRange: [[1, options.contentEndPage - 1]],
            ...contentsPadding,
          },
        },
        {
          id: `${Date.now()}${Math.random()}`,
          editType: EditType.Split,
          content: {
            pageRange: [[1, options.contentEndPage - 1]],
            splitType: SplitType.Vertical,
          },
        },
      ];
    },
  },
];

interface AddTemplateListItemProps {
  bookId: string;
  maxPage: number;
  onAdded: (editTypeContents: EditTypeContent[]) => void;
}

export const AddTemplateListItem = (props: AddTemplateListItemProps) => {
  const { bookId, maxPage, onAdded } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [options, setOptions] = useState(null);
  const handleClose = useCallback(() => {
    setSelectedTemplate(null);
    setOptions(null);
    setAnchorEl(null);
  }, []);
  return (
    <>
      <ListItemButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <ListItemIcon>
          <Icon>add</Icon>
        </ListItemIcon>
        <ListItemText primary="Use Template" />
      </ListItemButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {Templates.map((template) => (
          <MenuItem
            key={template.name}
            onClick={async () => {
              const initOptions = template.initOptions(maxPage);
              if (Object.keys(initOptions).length === 0) {
                const editContents = await template.exec(
                  bookId,
                  maxPage,
                  initOptions,
                );
                onAdded(editContents);
                handleClose();
              } else {
                setSelectedTemplate(template);
                setOptions({ ...initOptions });
              }
            }}
          >
            {template.name}
          </MenuItem>
        ))}
      </Menu>
      <Dialog open={selectedTemplate != null && options !== null}>
        <DialogTitle>Template options</DialogTitle>
        <DialogContent>
          {Object.keys(options || {}).map((key) => (
            <TextField
              key={key}
              margin="dense"
              fullWidth
              variant="standard"
              label={key}
              type="number"
              value={options[key]}
              onChange={(e) =>
                setOptions({
                  ...options,
                  [key]: e.target.value,
                })
              }
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={async () => {
              const editContents = await selectedTemplate.exec(
                bookId,
                maxPage,
                options,
              );
              onAdded(editContents);
              handleClose();
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

interface ActionListItemProps extends ListItemProps {
  ref: ForwardedRef<unknown>;
  editType?: EditType;
}

export const ActionListItem = forwardRef((props: ActionListItemProps, ref) => {
  const { editType, ...forwardProps } = props;
  const Item = ListItems[editType] ?? UnknownListItem;
  return <Item ref={ref} {...forwardProps} />;
});
