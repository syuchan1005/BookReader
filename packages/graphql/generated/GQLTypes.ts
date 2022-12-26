/* This file generated by @graphql-codegen */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type BigInt = number;
export type IntRange = (number | [number, number])[];
export type Upload = Promise<{ filename: string, mimetype: string, encoding: string, createReadStream: () => NodeJS.ReadableStream }>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigInt: BigInt;
  IntRange: IntRange;
  Upload: Upload;
};

export type Auth0 = {
  __typename?: 'Auth0';
  clientId: Scalars['String'];
  domain: Scalars['String'];
};

export type Book = {
  __typename?: 'Book';
  id: Scalars['ID'];
  info?: Maybe<BookInfo>;
  number: Scalars['String'];
  pages: Scalars['Int'];
  thumbnail?: Maybe<Scalars['Int']>;
  updatedAt: Scalars['String'];
};

export type BookInfo = {
  __typename?: 'BookInfo';
  books: Array<Book>;
  count: Scalars['Int'];
  genres: Array<Genre>;
  id: Scalars['ID'];
  name: Scalars['String'];
  thumbnail?: Maybe<BookInfoThumbnail>;
  updatedAt: Scalars['String'];
};


export type BookInfoBooksArgs = {
  order?: InputMaybe<BookOrder>;
};

export type BookInfoEdge = {
  __typename?: 'BookInfoEdge';
  cursor: Scalars['String'];
  node: BookInfo;
};

export type BookInfoList = {
  __typename?: 'BookInfoList';
  hasNext: Scalars['Boolean'];
  infos: Array<BookInfo>;
};

export const BookInfoOrder = {
  AddNewest: 'Add_Newest',
  AddOldest: 'Add_Oldest',
  NameAsc: 'Name_Asc',
  NameDesc: 'Name_Desc',
  UpdateNewest: 'Update_Newest',
  UpdateOldest: 'Update_Oldest'
} as const;

export type BookInfoOrder = typeof BookInfoOrder[keyof typeof BookInfoOrder];
export type BookInfoPartialList = {
  __typename?: 'BookInfoPartialList';
  edges: Array<BookInfoEdge>;
  pageInfo: PageInfo;
};

export type BookInfoResult = {
  __typename?: 'BookInfoResult';
  books: Array<Book>;
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type BookInfoThumbnail = {
  __typename?: 'BookInfoThumbnail';
  bookId: Scalars['ID'];
  bookPageCount: Scalars['Int'];
  pageIndex: Scalars['Int'];
};

export type BookInfosOption = {
  genres?: InputMaybe<Array<Scalars['String']>>;
  order?: InputMaybe<BookInfoOrder>;
  search?: InputMaybe<Scalars['String']>;
  searchMode?: InputMaybe<SearchMode>;
};

export const BookOrder = {
  NumberAsc: 'Number_Asc',
  NumberDesc: 'Number_Desc',
  UpdateNewest: 'Update_Newest',
  UpdateOldest: 'Update_Oldest'
} as const;

export type BookOrder = typeof BookOrder[keyof typeof BookOrder];
export type CommonPluginQuery = {
  __typename?: 'CommonPluginQuery';
  args: Array<Scalars['String']>;
  name: Scalars['String'];
  subscription?: Maybe<Scalars['Boolean']>;
};

export type CropEditAction = {
  bottom?: InputMaybe<Scalars['Int']>;
  left?: InputMaybe<Scalars['Int']>;
  pageRange: Scalars['IntRange'];
  right?: InputMaybe<Scalars['Int']>;
  top?: InputMaybe<Scalars['Int']>;
};

export type Debug_BookCounts = {
  __typename?: 'Debug_BookCounts';
  bookCount: Scalars['Int'];
  bookInfoCount: Scalars['Int'];
};

export type DeleteEditAction = {
  pageRange: Scalars['IntRange'];
};

export type EditAction = {
  crop?: InputMaybe<CropEditAction>;
  delete?: InputMaybe<DeleteEditAction>;
  editType: EditType;
  put?: InputMaybe<UploadEditAction>;
  replace?: InputMaybe<UploadEditAction>;
  split?: InputMaybe<SplitEditAction>;
};

export const EditType = {
  Crop: 'Crop',
  Delete: 'Delete',
  Put: 'Put',
  Replace: 'Replace',
  Split: 'Split'
} as const;

export type EditType = typeof EditType[keyof typeof EditType];
export type Genre = {
  __typename?: 'Genre';
  invisible: Scalars['Boolean'];
  name: Scalars['ID'];
};

export type InputBook = {
  file?: InputMaybe<Scalars['Upload']>;
  number: Scalars['String'];
  path?: InputMaybe<Scalars['String']>;
};

export type InputRead = {
  bookId: Scalars['ID'];
  infoId: Scalars['ID'];
  page: Scalars['Int'];
  updatedAt: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addBookInfo: ResultWithInfoId;
  addBooks: Array<Result>;
  addCompressBook: ResultWithBookResults;
  bulkEditPage: Result;
  debug_deleteUnusedFolders: Result;
  debug_rebuildMeiliSearch: Result;
  deleteBookInfo: BookInfoResult;
  deleteBooks: Result;
  deleteGenre: Result;
  editBook: Result;
  editBookInfo: Result;
  editGenre: Result;
  moveBooks: Result;
};


export type MutationAddBookInfoArgs = {
  genres?: InputMaybe<Array<Scalars['String']>>;
  name: Scalars['String'];
};


export type MutationAddBooksArgs = {
  books: Array<InputBook>;
  id: Scalars['ID'];
};


export type MutationAddCompressBookArgs = {
  file?: InputMaybe<Scalars['Upload']>;
  id: Scalars['ID'];
  path?: InputMaybe<Scalars['String']>;
};


export type MutationBulkEditPageArgs = {
  actions: Array<EditAction>;
  id: Scalars['ID'];
};


export type MutationDeleteBookInfoArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBooksArgs = {
  ids: Array<Scalars['ID']>;
  infoId: Scalars['ID'];
};


export type MutationDeleteGenreArgs = {
  genre: Scalars['String'];
};


export type MutationEditBookArgs = {
  id: Scalars['ID'];
  number?: InputMaybe<Scalars['String']>;
  thumbnail?: InputMaybe<Scalars['Int']>;
};


export type MutationEditBookInfoArgs = {
  genres?: InputMaybe<Array<Scalars['String']>>;
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  thumbnail?: InputMaybe<Scalars['ID']>;
};


export type MutationEditGenreArgs = {
  invisible?: InputMaybe<Scalars['Boolean']>;
  newName?: InputMaybe<Scalars['String']>;
  oldName: Scalars['String'];
};


export type MutationMoveBooksArgs = {
  ids: Array<Scalars['ID']>;
  infoId: Scalars['ID'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Scalars['String'];
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor: Scalars['String'];
};

export type Plugin = {
  __typename?: 'Plugin';
  info: PluginInfo;
  queries: PluginQueries;
};

export type PluginInfo = {
  __typename?: 'PluginInfo';
  name: Scalars['String'];
  version: Scalars['String'];
};

export type PluginQueries = {
  __typename?: 'PluginQueries';
  add: CommonPluginQuery;
};

export type Query = {
  __typename?: 'Query';
  availableSearchModes: Array<SearchMode>;
  book?: Maybe<Book>;
  bookInfo?: Maybe<BookInfo>;
  bookInfos: Array<Maybe<BookInfo>>;
  books: Array<Maybe<Book>>;
  debug_bookCounts: Debug_BookCounts;
  genres: Array<Genre>;
  plugins: Array<Plugin>;
  relayBookInfos: BookInfoPartialList;
};


export type QueryBookArgs = {
  id: Scalars['ID'];
};


export type QueryBookInfoArgs = {
  id: Scalars['ID'];
};


export type QueryBookInfosArgs = {
  ids: Array<Scalars['ID']>;
};


export type QueryBooksArgs = {
  ids: Array<Scalars['ID']>;
};


export type QueryRelayBookInfosArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  option?: InputMaybe<BookInfosOption>;
};

export type Read = {
  __typename?: 'Read';
  bookId: Scalars['ID'];
  infoId: Scalars['ID'];
  page: Scalars['Int'];
  updatedAt: Scalars['String'];
};

export type ReadList = {
  __typename?: 'ReadList';
  latestRevision: Revision;
  readList: Array<Read>;
};

export type Result = {
  __typename?: 'Result';
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type ResultWithBookResults = {
  __typename?: 'ResultWithBookResults';
  bookResults?: Maybe<Array<Result>>;
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type ResultWithInfoId = {
  __typename?: 'ResultWithInfoId';
  code?: Maybe<Scalars['String']>;
  infoId?: Maybe<Scalars['ID']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type Revision = {
  __typename?: 'Revision';
  count: Scalars['Int'];
  syncedAt: Scalars['String'];
};

export const SearchMode = {
  Database: 'DATABASE',
  Elasticsearch: 'ELASTICSEARCH',
  Meilisearch: 'MEILISEARCH'
} as const;

export type SearchMode = typeof SearchMode[keyof typeof SearchMode];
export type SplitEditAction = {
  pageRange: Scalars['IntRange'];
  splitCount?: InputMaybe<Scalars['Int']>;
  splitType: SplitType;
};

export const SplitType = {
  Horizontal: 'HORIZONTAL',
  Vertical: 'VERTICAL'
} as const;

export type SplitType = typeof SplitType[keyof typeof SplitType];
export type Subscription = {
  __typename?: 'Subscription';
  addBooks: Scalars['String'];
  bulkEditPage: Scalars['String'];
};


export type SubscriptionAddBooksArgs = {
  id: Scalars['ID'];
};


export type SubscriptionBulkEditPageArgs = {
  id: Scalars['ID'];
};

export type UploadEditAction = {
  image: Scalars['Upload'];
  pageIndex: Scalars['Int'];
};

export type AddBooksMutationVariables = Exact<{
  id: Scalars['ID'];
  books: Array<InputBook> | InputBook;
}>;


export type AddBooksMutation = { __typename?: 'Mutation', adds: Array<{ __typename?: 'Result', success: boolean, code?: string | null }> };

export type AddBooksProgressSubscriptionVariables = Exact<{
  id: Scalars['ID'];
}>;


export type AddBooksProgressSubscription = { __typename?: 'Subscription', addBooks: string };

export type AddCompressBookMutationVariables = Exact<{
  id: Scalars['ID'];
  file?: InputMaybe<Scalars['Upload']>;
  path?: InputMaybe<Scalars['String']>;
}>;


export type AddCompressBookMutation = { __typename?: 'Mutation', add: { __typename?: 'ResultWithBookResults', success: boolean, code?: string | null } };

export type PluginsQueryVariables = Exact<{ [key: string]: never; }>;


export type PluginsQuery = { __typename?: 'Query', plugins: Array<{ __typename?: 'Plugin', info: { __typename?: 'PluginInfo', name: string }, queries: { __typename?: 'PluginQueries', add: { __typename?: 'CommonPluginQuery', name: string, args: Array<string>, subscription?: boolean | null } } }> };

export type AddBookInfoMutationVariables = Exact<{
  name: Scalars['String'];
  genres: Array<Scalars['String']> | Scalars['String'];
}>;


export type AddBookInfoMutation = { __typename?: 'Mutation', add: { __typename?: 'ResultWithInfoId', success: boolean, code?: string | null, infoId?: string | null } };

export type DebugBookCountsQueryVariables = Exact<{ [key: string]: never; }>;


export type DebugBookCountsQuery = { __typename?: 'Query', sizes: { __typename?: 'Debug_BookCounts', bookInfoCount: number, bookCount: number } };

export type DeleteUnusedFoldersMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteUnusedFoldersMutation = { __typename?: 'Mutation', debug_deleteUnusedFolders: { __typename?: 'Result', success: boolean, code?: string | null } };

export type RebuildMeiliSearchMutationVariables = Exact<{ [key: string]: never; }>;


export type RebuildMeiliSearchMutation = { __typename?: 'Mutation', debug_rebuildMeiliSearch: { __typename?: 'Result', success: boolean } };

export type DeleteBookInfoMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteBookInfoMutation = { __typename?: 'Mutation', del: { __typename?: 'BookInfoResult', success: boolean, code?: string | null, books: Array<{ __typename?: 'Book', id: string, pages: number }> } };

export type EditBookInfoMutationVariables = Exact<{
  id: Scalars['ID'];
  name?: InputMaybe<Scalars['String']>;
  genres: Array<Scalars['String']> | Scalars['String'];
}>;


export type EditBookInfoMutation = { __typename?: 'Mutation', edit: { __typename?: 'Result', success: boolean, code?: string | null } };

export type EditBookMutationVariables = Exact<{
  id: Scalars['ID'];
  number?: InputMaybe<Scalars['String']>;
}>;


export type EditBookMutation = { __typename?: 'Mutation', edit: { __typename?: 'Result', success: boolean, code?: string | null } };

export type DownloadBookInfosQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DownloadBookInfosQuery = { __typename?: 'Query', bookInfo?: { __typename?: 'BookInfo', id: string, name: string, count: number, books: Array<{ __typename?: 'Book', id: string, number: string, pages: number }> } | null };

export type BulkEditPagesMutationVariables = Exact<{
  bookId: Scalars['ID'];
  editActions: Array<EditAction> | EditAction;
}>;


export type BulkEditPagesMutation = { __typename?: 'Mutation', bulkEditPage: { __typename?: 'Result', success: boolean, code?: string | null, message?: string | null } };

export type BulkEditPageProgressSubscriptionVariables = Exact<{
  bookId: Scalars['ID'];
}>;


export type BulkEditPageProgressSubscription = { __typename?: 'Subscription', bulkEditPage: string };

export type BookQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type BookQuery = { __typename?: 'Query', book?: { __typename?: 'Book', id: string, number: string, pages: number, info?: { __typename?: 'BookInfo', id: string, name: string } | null } | null };

export type RelayBookInfosQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']>;
  after?: InputMaybe<Scalars['String']>;
  option: BookInfosOption;
}>;


export type RelayBookInfosQuery = { __typename?: 'Query', bookInfos: { __typename?: 'BookInfoPartialList', edges: Array<{ __typename?: 'BookInfoEdge', cursor: string, node: { __typename?: 'BookInfo', id: string, name: string, count: number, updatedAt: string, thumbnail?: { __typename?: 'BookInfoThumbnail', bookId: string, pageIndex: number, bookPageCount: number } | null, genres: Array<{ __typename?: 'Genre', name: string, invisible: boolean }> } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string, endCursor: string } } };

export type DeleteGenreMutationVariables = Exact<{
  name: Scalars['String'];
}>;


export type DeleteGenreMutation = { __typename?: 'Mutation', deleteGenre: { __typename?: 'Result', code?: string | null, success: boolean, message?: string | null } };

export type EditGenreMutationVariables = Exact<{
  oldName: Scalars['String'];
  newName?: InputMaybe<Scalars['String']>;
  invisible?: InputMaybe<Scalars['Boolean']>;
}>;


export type EditGenreMutation = { __typename?: 'Mutation', editGenre: { __typename?: 'Result', code?: string | null, success: boolean, message?: string | null } };

export type BookInfosQueryVariables = Exact<{
  ids: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type BookInfosQuery = { __typename?: 'Query', bookInfos: Array<{ __typename?: 'BookInfo', id: string, name: string, count: number, updatedAt: string, thumbnail?: { __typename?: 'BookInfoThumbnail', bookId: string, pageIndex: number, bookPageCount: number } | null, genres: Array<{ __typename?: 'Genre', name: string, invisible: boolean }> } | null> };

export type BooksQueryVariables = Exact<{
  ids: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type BooksQuery = { __typename?: 'Query', books: Array<{ __typename?: 'Book', id: string, number: string, pages: number, thumbnail?: number | null, updatedAt: string, info?: { __typename?: 'BookInfo', id: string, name: string } | null } | null> };

export type AvailableSearchModesQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableSearchModesQuery = { __typename?: 'Query', availableSearchModes: Array<SearchMode> };

export type DeleteBooksMutationVariables = Exact<{
  infoId: Scalars['ID'];
  ids: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type DeleteBooksMutation = { __typename?: 'Mutation', deleteBooks: { __typename?: 'Result', success: boolean, code?: string | null } };

export type MoveBooksMutationVariables = Exact<{
  infoId: Scalars['ID'];
  ids: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type MoveBooksMutation = { __typename?: 'Mutation', moveBooks: { __typename?: 'Result', success: boolean, code?: string | null } };

export type EditBookInfoThumbnailMutationVariables = Exact<{
  id: Scalars['ID'];
  thumbnail?: InputMaybe<Scalars['ID']>;
}>;


export type EditBookInfoThumbnailMutation = { __typename?: 'Mutation', edit: { __typename?: 'Result', success: boolean, code?: string | null } };

export type BookPagesQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type BookPagesQuery = { __typename?: 'Query', book?: { __typename?: 'Book', id: string, pages: number } | null };

export type EditBookThumbnailMutationVariables = Exact<{
  id: Scalars['ID'];
  th?: InputMaybe<Scalars['Int']>;
}>;


export type EditBookThumbnailMutation = { __typename?: 'Mutation', edit: { __typename?: 'Result', success: boolean, code?: string | null } };

export type BookInfoQueryVariables = Exact<{
  id: Scalars['ID'];
  order?: InputMaybe<BookOrder>;
}>;


export type BookInfoQuery = { __typename?: 'Query', bookInfo?: { __typename?: 'BookInfo', id: string, name: string, books: Array<{ __typename?: 'Book', id: string, number: string, pages: number, thumbnail?: number | null, updatedAt: string, info?: { __typename?: 'BookInfo', id: string } | null }> } | null };

export type GenresQueryVariables = Exact<{ [key: string]: never; }>;


export type GenresQuery = { __typename?: 'Query', genres: Array<{ __typename?: 'Genre', name: string, invisible: boolean }> };



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Auth0: ResolverTypeWrapper<Auth0>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>;
  Book: ResolverTypeWrapper<Book>;
  BookInfo: ResolverTypeWrapper<BookInfo>;
  BookInfoEdge: ResolverTypeWrapper<BookInfoEdge>;
  BookInfoList: ResolverTypeWrapper<BookInfoList>;
  BookInfoOrder: BookInfoOrder;
  BookInfoPartialList: ResolverTypeWrapper<BookInfoPartialList>;
  BookInfoResult: ResolverTypeWrapper<BookInfoResult>;
  BookInfoThumbnail: ResolverTypeWrapper<BookInfoThumbnail>;
  BookInfosOption: BookInfosOption;
  BookOrder: BookOrder;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CommonPluginQuery: ResolverTypeWrapper<CommonPluginQuery>;
  CropEditAction: CropEditAction;
  Debug_BookCounts: ResolverTypeWrapper<Debug_BookCounts>;
  DeleteEditAction: DeleteEditAction;
  EditAction: EditAction;
  EditType: EditType;
  Genre: ResolverTypeWrapper<Genre>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  InputBook: InputBook;
  InputRead: InputRead;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  IntRange: ResolverTypeWrapper<Scalars['IntRange']>;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Plugin: ResolverTypeWrapper<Plugin>;
  PluginInfo: ResolverTypeWrapper<PluginInfo>;
  PluginQueries: ResolverTypeWrapper<PluginQueries>;
  Query: ResolverTypeWrapper<{}>;
  Read: ResolverTypeWrapper<Read>;
  ReadList: ResolverTypeWrapper<ReadList>;
  Result: ResolverTypeWrapper<Result>;
  ResultWithBookResults: ResolverTypeWrapper<ResultWithBookResults>;
  ResultWithInfoId: ResolverTypeWrapper<ResultWithInfoId>;
  Revision: ResolverTypeWrapper<Revision>;
  SearchMode: SearchMode;
  SplitEditAction: SplitEditAction;
  SplitType: SplitType;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  UploadEditAction: UploadEditAction;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Auth0: Auth0;
  BigInt: Scalars['BigInt'];
  Book: Book;
  BookInfo: BookInfo;
  BookInfoEdge: BookInfoEdge;
  BookInfoList: BookInfoList;
  BookInfoPartialList: BookInfoPartialList;
  BookInfoResult: BookInfoResult;
  BookInfoThumbnail: BookInfoThumbnail;
  BookInfosOption: BookInfosOption;
  Boolean: Scalars['Boolean'];
  CommonPluginQuery: CommonPluginQuery;
  CropEditAction: CropEditAction;
  Debug_BookCounts: Debug_BookCounts;
  DeleteEditAction: DeleteEditAction;
  EditAction: EditAction;
  Genre: Genre;
  ID: Scalars['ID'];
  InputBook: InputBook;
  InputRead: InputRead;
  Int: Scalars['Int'];
  IntRange: Scalars['IntRange'];
  Mutation: {};
  PageInfo: PageInfo;
  Plugin: Plugin;
  PluginInfo: PluginInfo;
  PluginQueries: PluginQueries;
  Query: {};
  Read: Read;
  ReadList: ReadList;
  Result: Result;
  ResultWithBookResults: ResultWithBookResults;
  ResultWithInfoId: ResultWithInfoId;
  Revision: Revision;
  SplitEditAction: SplitEditAction;
  String: Scalars['String'];
  Subscription: {};
  Upload: Scalars['Upload'];
  UploadEditAction: UploadEditAction;
};

export type Auth0Resolvers<ContextType = any, ParentType extends ResolversParentTypes['Auth0'] = ResolversParentTypes['Auth0']> = {
  clientId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export type BookResolvers<ContextType = any, ParentType extends ResolversParentTypes['Book'] = ResolversParentTypes['Book']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  info?: Resolver<Maybe<ResolversTypes['BookInfo']>, ParentType, ContextType>;
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BookInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfo'] = ResolversParentTypes['BookInfo']> = {
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<BookInfoBooksArgs, 'order'>>;
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  genres?: Resolver<Array<ResolversTypes['Genre']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['BookInfoThumbnail']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BookInfoEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoEdge'] = ResolversParentTypes['BookInfoEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['BookInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BookInfoListResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoList'] = ResolversParentTypes['BookInfoList']> = {
  hasNext?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  infos?: Resolver<Array<ResolversTypes['BookInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BookInfoPartialListResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoPartialList'] = ResolversParentTypes['BookInfoPartialList']> = {
  edges?: Resolver<Array<ResolversTypes['BookInfoEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BookInfoResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoResult'] = ResolversParentTypes['BookInfoResult']> = {
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType>;
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BookInfoThumbnailResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoThumbnail'] = ResolversParentTypes['BookInfoThumbnail']> = {
  bookId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  bookPageCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageIndex?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommonPluginQueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['CommonPluginQuery'] = ResolversParentTypes['CommonPluginQuery']> = {
  args?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  subscription?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Debug_BookCountsResolvers<ContextType = any, ParentType extends ResolversParentTypes['Debug_BookCounts'] = ResolversParentTypes['Debug_BookCounts']> = {
  bookCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bookInfoCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenreResolvers<ContextType = any, ParentType extends ResolversParentTypes['Genre'] = ResolversParentTypes['Genre']> = {
  invisible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface IntRangeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IntRange'], any> {
  name: 'IntRange';
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addBookInfo?: Resolver<ResolversTypes['ResultWithInfoId'], ParentType, ContextType, RequireFields<MutationAddBookInfoArgs, 'name'>>;
  addBooks?: Resolver<Array<ResolversTypes['Result']>, ParentType, ContextType, RequireFields<MutationAddBooksArgs, 'books' | 'id'>>;
  addCompressBook?: Resolver<ResolversTypes['ResultWithBookResults'], ParentType, ContextType, RequireFields<MutationAddCompressBookArgs, 'id'>>;
  bulkEditPage?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationBulkEditPageArgs, 'actions' | 'id'>>;
  debug_deleteUnusedFolders?: Resolver<ResolversTypes['Result'], ParentType, ContextType>;
  debug_rebuildMeiliSearch?: Resolver<ResolversTypes['Result'], ParentType, ContextType>;
  deleteBookInfo?: Resolver<ResolversTypes['BookInfoResult'], ParentType, ContextType, RequireFields<MutationDeleteBookInfoArgs, 'id'>>;
  deleteBooks?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationDeleteBooksArgs, 'ids' | 'infoId'>>;
  deleteGenre?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationDeleteGenreArgs, 'genre'>>;
  editBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditBookArgs, 'id'>>;
  editBookInfo?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditBookInfoArgs, 'id'>>;
  editGenre?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditGenreArgs, 'oldName'>>;
  moveBooks?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationMoveBooksArgs, 'ids' | 'infoId'>>;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  endCursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PluginResolvers<ContextType = any, ParentType extends ResolversParentTypes['Plugin'] = ResolversParentTypes['Plugin']> = {
  info?: Resolver<ResolversTypes['PluginInfo'], ParentType, ContextType>;
  queries?: Resolver<ResolversTypes['PluginQueries'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PluginInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PluginInfo'] = ResolversParentTypes['PluginInfo']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PluginQueriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['PluginQueries'] = ResolversParentTypes['PluginQueries']> = {
  add?: Resolver<ResolversTypes['CommonPluginQuery'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  availableSearchModes?: Resolver<Array<ResolversTypes['SearchMode']>, ParentType, ContextType>;
  book?: Resolver<Maybe<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<QueryBookArgs, 'id'>>;
  bookInfo?: Resolver<Maybe<ResolversTypes['BookInfo']>, ParentType, ContextType, RequireFields<QueryBookInfoArgs, 'id'>>;
  bookInfos?: Resolver<Array<Maybe<ResolversTypes['BookInfo']>>, ParentType, ContextType, RequireFields<QueryBookInfosArgs, 'ids'>>;
  books?: Resolver<Array<Maybe<ResolversTypes['Book']>>, ParentType, ContextType, RequireFields<QueryBooksArgs, 'ids'>>;
  debug_bookCounts?: Resolver<ResolversTypes['Debug_BookCounts'], ParentType, ContextType>;
  genres?: Resolver<Array<ResolversTypes['Genre']>, ParentType, ContextType>;
  plugins?: Resolver<Array<ResolversTypes['Plugin']>, ParentType, ContextType>;
  relayBookInfos?: Resolver<ResolversTypes['BookInfoPartialList'], ParentType, ContextType, Partial<QueryRelayBookInfosArgs>>;
};

export type ReadResolvers<ContextType = any, ParentType extends ResolversParentTypes['Read'] = ResolversParentTypes['Read']> = {
  bookId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  infoId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ReadListResolvers<ContextType = any, ParentType extends ResolversParentTypes['ReadList'] = ResolversParentTypes['ReadList']> = {
  latestRevision?: Resolver<ResolversTypes['Revision'], ParentType, ContextType>;
  readList?: Resolver<Array<ResolversTypes['Read']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['Result'] = ResolversParentTypes['Result']> = {
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResultWithBookResultsResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResultWithBookResults'] = ResolversParentTypes['ResultWithBookResults']> = {
  bookResults?: Resolver<Maybe<Array<ResolversTypes['Result']>>, ParentType, ContextType>;
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResultWithInfoIdResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResultWithInfoId'] = ResolversParentTypes['ResultWithInfoId']> = {
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  infoId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RevisionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Revision'] = ResolversParentTypes['Revision']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  syncedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  addBooks?: SubscriptionResolver<ResolversTypes['String'], "addBooks", ParentType, ContextType, RequireFields<SubscriptionAddBooksArgs, 'id'>>;
  bulkEditPage?: SubscriptionResolver<ResolversTypes['String'], "bulkEditPage", ParentType, ContextType, RequireFields<SubscriptionBulkEditPageArgs, 'id'>>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type Resolvers<ContextType = any> = {
  Auth0?: Auth0Resolvers<ContextType>;
  BigInt?: GraphQLScalarType;
  Book?: BookResolvers<ContextType>;
  BookInfo?: BookInfoResolvers<ContextType>;
  BookInfoEdge?: BookInfoEdgeResolvers<ContextType>;
  BookInfoList?: BookInfoListResolvers<ContextType>;
  BookInfoPartialList?: BookInfoPartialListResolvers<ContextType>;
  BookInfoResult?: BookInfoResultResolvers<ContextType>;
  BookInfoThumbnail?: BookInfoThumbnailResolvers<ContextType>;
  CommonPluginQuery?: CommonPluginQueryResolvers<ContextType>;
  Debug_BookCounts?: Debug_BookCountsResolvers<ContextType>;
  Genre?: GenreResolvers<ContextType>;
  IntRange?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Plugin?: PluginResolvers<ContextType>;
  PluginInfo?: PluginInfoResolvers<ContextType>;
  PluginQueries?: PluginQueriesResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Read?: ReadResolvers<ContextType>;
  ReadList?: ReadListResolvers<ContextType>;
  Result?: ResultResolvers<ContextType>;
  ResultWithBookResults?: ResultWithBookResultsResolvers<ContextType>;
  ResultWithInfoId?: ResultWithInfoIdResolvers<ContextType>;
  Revision?: RevisionResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Upload?: GraphQLScalarType;
};

