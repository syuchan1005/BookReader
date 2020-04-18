import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Upload: Promise<{ filename: string, mimetype: string, encoding: string, createReadStream: () => NodeJS.ReadableStream }>;
  BigInt: number;
  IntRange: (number | [number, number])[];
};




export type Query = {
   __typename?: 'Query';
  bookInfos: BookInfoList;
  bookInfo?: Maybe<BookInfo>;
  books: Array<Book>;
  book?: Maybe<Book>;
  debug_folderSize: Debug_FolderSizes;
  plugins: Array<Plugin>;
  genres: Array<Genre>;
};


export type QueryBookInfosArgs = {
  length?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  genres?: Maybe<Array<Scalars['String']>>;
  history?: Maybe<Scalars['Boolean']>;
  order?: Maybe<BookInfoOrder>;
};


export type QueryBookInfoArgs = {
  id: Scalars['ID'];
};


export type QueryBooksArgs = {
  id?: Maybe<Scalars['ID']>;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  order?: Maybe<BookOrder>;
};


export type QueryBookArgs = {
  id: Scalars['ID'];
};

export type Mutation = {
   __typename?: 'Mutation';
  addBookInfo: ResultWithInfoId;
  editBookInfo: Result;
  deleteBookInfo: BookInfoResult;
  addBookInfoHistories: Result;
  addBook: Result;
  addBooks: Array<Result>;
  addCompressBook: ResultWithBookResults;
  editBook: Result;
  deleteBook: Result;
  deleteBooks: Result;
  moveBooks: Result;
  deletePages: Result;
  splitPages: Result;
  editPage: Result;
  putPage: Result;
  debug_deleteUnusedFolders: Result;
  deleteGenre: Result;
  editGenre: Result;
};


export type MutationAddBookInfoArgs = {
  name: Scalars['String'];
  thumbnail?: Maybe<Scalars['Upload']>;
  genres?: Maybe<Array<Scalars['String']>>;
};


export type MutationEditBookInfoArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  thumbnail?: Maybe<Scalars['String']>;
  genres?: Maybe<Array<Scalars['String']>>;
};


export type MutationDeleteBookInfoArgs = {
  id: Scalars['ID'];
};


export type MutationAddBookInfoHistoriesArgs = {
  histories: Array<BookInfoHistory>;
};


export type MutationAddBookArgs = {
  id: Scalars['ID'];
  number: Scalars['String'];
  file: Scalars['Upload'];
};


export type MutationAddBooksArgs = {
  id: Scalars['ID'];
  books: Array<InputBook>;
};


export type MutationAddCompressBookArgs = {
  id: Scalars['ID'];
  file: Scalars['Upload'];
};


export type MutationEditBookArgs = {
  id: Scalars['ID'];
  number?: Maybe<Scalars['String']>;
  thumbnail?: Maybe<Scalars['String']>;
};


export type MutationDeleteBookArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteBooksArgs = {
  infoId: Scalars['ID'];
  ids: Array<Scalars['ID']>;
};


export type MutationMoveBooksArgs = {
  infoId: Scalars['ID'];
  ids: Array<Scalars['ID']>;
};


export type MutationDeletePagesArgs = {
  id: Scalars['ID'];
  pages: Scalars['IntRange'];
};


export type MutationSplitPagesArgs = {
  id: Scalars['ID'];
  pages: Scalars['IntRange'];
  type?: Maybe<SplitType>;
};


export type MutationEditPageArgs = {
  id: Scalars['ID'];
  page: Scalars['Int'];
  image: Scalars['Upload'];
};


export type MutationPutPageArgs = {
  id: Scalars['ID'];
  beforePage: Scalars['Int'];
  image: Scalars['Upload'];
};


export type MutationDeleteGenreArgs = {
  genre: Scalars['String'];
};


export type MutationEditGenreArgs = {
  oldName: Scalars['String'];
  newName?: Maybe<Scalars['String']>;
  invisible?: Maybe<Scalars['Boolean']>;
};

export type Subscription = {
   __typename?: 'Subscription';
  addBookInfo: Scalars['String'];
  addBooks: Scalars['String'];
};


export type SubscriptionAddBookInfoArgs = {
  name: Scalars['String'];
};


export type SubscriptionAddBooksArgs = {
  id: Scalars['ID'];
};

export enum BookInfoOrder {
  UpdateNewest = 'Update_Newest',
  UpdateOldest = 'Update_Oldest',
  AddNewest = 'Add_Newest',
  AddOldest = 'Add_Oldest',
  NameAsc = 'Name_Asc',
  NameDesc = 'Name_Desc'
}

export enum BookOrder {
  UpdateNewest = 'Update_Newest',
  UpdateOldest = 'Update_Oldest',
  NumberAsc = 'Number_Asc',
  NumberDesc = 'Number_Desc'
}

export enum SplitType {
  Vertical = 'VERTICAL',
  Horizontal = 'HORIZONTAL'
}

export type BookInfo = {
   __typename?: 'BookInfo';
  id: Scalars['ID'];
  name: Scalars['String'];
  thumbnail?: Maybe<Scalars['String']>;
  count: Scalars['Int'];
  history: Scalars['Boolean'];
  genres: Array<Genre>;
  books: Array<Book>;
};


export type BookInfoBooksArgs = {
  order?: Maybe<BookOrder>;
};

export type Book = {
   __typename?: 'Book';
  id: Scalars['ID'];
  thumbnail?: Maybe<Scalars['String']>;
  number: Scalars['String'];
  pages: Scalars['Int'];
  info?: Maybe<BookInfo>;
};

export type BookInfoList = {
   __typename?: 'BookInfoList';
  hasNext: Scalars['Boolean'];
  infos: Array<BookInfo>;
};

export type Result = {
   __typename?: 'Result';
  success: Scalars['Boolean'];
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
};

export type ResultWithInfoId = {
   __typename?: 'ResultWithInfoId';
  success: Scalars['Boolean'];
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  infoId?: Maybe<Scalars['ID']>;
};

export type ResultWithBookResults = {
   __typename?: 'ResultWithBookResults';
  success: Scalars['Boolean'];
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  bookResults?: Maybe<Array<Result>>;
};

export type BookInfoResult = {
   __typename?: 'BookInfoResult';
  success: Scalars['Boolean'];
  code?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  books: Array<Book>;
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

export type CommonPluginQuery = {
   __typename?: 'CommonPluginQuery';
  name: Scalars['String'];
  args: Array<Scalars['String']>;
  subscription?: Maybe<Scalars['Boolean']>;
};

export type Genre = {
   __typename?: 'Genre';
  id: Scalars['Int'];
  name: Scalars['String'];
  invisible: Scalars['Boolean'];
};

export type InputBook = {
  number: Scalars['String'];
  file: Scalars['Upload'];
};

export type BookInfoHistory = {
  name: Scalars['String'];
  count: Scalars['Int'];
};

export type Debug_FolderSizes = {
   __typename?: 'Debug_FolderSizes';
  tmp: Scalars['BigInt'];
  cache: Scalars['BigInt'];
  book: Scalars['BigInt'];
  unusedBook: Scalars['BigInt'];
  bookInfoCount: Scalars['Int'];
  bookCount: Scalars['Int'];
};

export type AddBooksMutationVariables = {
  id: Scalars['ID'];
  books: Array<InputBook>;
};


export type AddBooksMutation = (
  { __typename?: 'Mutation' }
  & { adds: Array<(
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  )> }
);

export type AddBooksProgressSubscriptionVariables = {
  id: Scalars['ID'];
};


export type AddBooksProgressSubscription = (
  { __typename?: 'Subscription' }
  & Pick<Subscription, 'addBooks'>
);

export type AddCompressBookMutationVariables = {
  id: Scalars['ID'];
  file: Scalars['Upload'];
};


export type AddCompressBookMutation = (
  { __typename?: 'Mutation' }
  & { add: (
    { __typename?: 'ResultWithBookResults' }
    & Pick<ResultWithBookResults, 'success' | 'code'>
  ) }
);

export type PluginsQueryVariables = {};


export type PluginsQuery = (
  { __typename?: 'Query' }
  & { plugins: Array<(
    { __typename?: 'Plugin' }
    & { info: (
      { __typename?: 'PluginInfo' }
      & Pick<PluginInfo, 'name'>
    ), queries: (
      { __typename?: 'PluginQueries' }
      & { add: (
        { __typename?: 'CommonPluginQuery' }
        & Pick<CommonPluginQuery, 'name' | 'args' | 'subscription'>
      ) }
    ) }
  )> }
);

export type AddBookInfoMutationVariables = {
  name: Scalars['String'];
  genres: Array<Scalars['String']>;
};


export type AddBookInfoMutation = (
  { __typename?: 'Mutation' }
  & { add: (
    { __typename?: 'ResultWithInfoId' }
    & Pick<ResultWithInfoId, 'success' | 'code'>
  ) }
);

export type AddBookInfoHistoriesMutationVariables = {
  histories: Array<BookInfoHistory>;
};


export type AddBookInfoHistoriesMutation = (
  { __typename?: 'Mutation' }
  & { add: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type DeleteUnusedFoldersMutationVariables = {};


export type DeleteUnusedFoldersMutation = (
  { __typename?: 'Mutation' }
  & { debug_deleteUnusedFolders: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type FolderSizesQueryVariables = {};


export type FolderSizesQuery = (
  { __typename?: 'Query' }
  & { sizes: (
    { __typename?: 'Debug_FolderSizes' }
    & Pick<Debug_FolderSizes, 'tmp' | 'cache' | 'book' | 'unusedBook' | 'bookInfoCount' | 'bookCount'>
  ) }
);

export type DeleteBookInfoMutationVariables = {
  id: Scalars['ID'];
};


export type DeleteBookInfoMutation = (
  { __typename?: 'Mutation' }
  & { del: (
    { __typename?: 'BookInfoResult' }
    & Pick<BookInfoResult, 'success' | 'code'>
    & { books: Array<(
      { __typename?: 'Book' }
      & Pick<Book, 'id' | 'pages'>
    )> }
  ) }
);

export type EditBookInfoMutationVariables = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  thumbnail?: Maybe<Scalars['String']>;
  genres: Array<Scalars['String']>;
};


export type EditBookInfoMutation = (
  { __typename?: 'Mutation' }
  & { edit: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type DeleteBookMutationVariables = {
  id: Scalars['ID'];
};


export type DeleteBookMutation = (
  { __typename?: 'Mutation' }
  & { del: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type EditBookMutationVariables = {
  id: Scalars['ID'];
  number?: Maybe<Scalars['String']>;
  thumbnail?: Maybe<Scalars['String']>;
};


export type EditBookMutation = (
  { __typename?: 'Mutation' }
  & { edit: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type DownloadBookInfosQueryVariables = {
  id: Scalars['ID'];
};


export type DownloadBookInfosQuery = (
  { __typename?: 'Query' }
  & { bookInfo?: Maybe<(
    { __typename?: 'BookInfo' }
    & Pick<BookInfo, 'id' | 'name' | 'count'>
    & { books: Array<(
      { __typename?: 'Book' }
      & Pick<Book, 'id' | 'number' | 'pages'>
    )> }
  )> }
);

export type DeletePagesMutationVariables = {
  id: Scalars['ID'];
  pages: Scalars['IntRange'];
};


export type DeletePagesMutation = (
  { __typename?: 'Mutation' }
  & { del: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type EditPageMutationVariables = {
  id: Scalars['ID'];
  page: Scalars['Int'];
  image: Scalars['Upload'];
};


export type EditPageMutation = (
  { __typename?: 'Mutation' }
  & { edit: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type PutPageMutationVariables = {
  id: Scalars['ID'];
  beforePage: Scalars['Int'];
  image: Scalars['Upload'];
};


export type PutPageMutation = (
  { __typename?: 'Mutation' }
  & { put: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type SplitPagesMutationVariables = {
  id: Scalars['ID'];
  pages: Scalars['IntRange'];
  type?: Maybe<SplitType>;
};


export type SplitPagesMutation = (
  { __typename?: 'Mutation' }
  & { split: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type BookQueryVariables = {
  id: Scalars['ID'];
};


export type BookQuery = (
  { __typename?: 'Query' }
  & { book?: Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id' | 'number' | 'pages'>
    & { info?: Maybe<(
      { __typename?: 'BookInfo' }
      & Pick<BookInfo, 'id' | 'name'>
    )> }
  )> }
);

export type BookInfosQueryVariables = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  order?: Maybe<BookInfoOrder>;
  history?: Maybe<Scalars['Boolean']>;
  genres: Array<Scalars['String']>;
};


export type BookInfosQuery = (
  { __typename?: 'Query' }
  & { bookInfos: (
    { __typename?: 'BookInfoList' }
    & Pick<BookInfoList, 'hasNext'>
    & { infos: Array<(
      { __typename?: 'BookInfo' }
      & Pick<BookInfo, 'id' | 'name' | 'count' | 'thumbnail' | 'history'>
      & { genres: Array<(
        { __typename?: 'Genre' }
        & Pick<Genre, 'id' | 'name' | 'invisible'>
      )> }
    )> }
  ) }
);

export type DeleteGenreMutationVariables = {
  name: Scalars['String'];
};


export type DeleteGenreMutation = (
  { __typename?: 'Mutation' }
  & { deleteGenre: (
    { __typename?: 'Result' }
    & Pick<Result, 'code' | 'success' | 'message'>
  ) }
);

export type EditGenreMutationVariables = {
  oldName: Scalars['String'];
  newName?: Maybe<Scalars['String']>;
  invisible?: Maybe<Scalars['Boolean']>;
};


export type EditGenreMutation = (
  { __typename?: 'Mutation' }
  & { editGenre: (
    { __typename?: 'Result' }
    & Pick<Result, 'code' | 'success' | 'message'>
  ) }
);

export type DeleteBooksMutationVariables = {
  infoId: Scalars['ID'];
  ids: Array<Scalars['ID']>;
};


export type DeleteBooksMutation = (
  { __typename?: 'Mutation' }
  & { deleteBooks: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type MoveBooksMutationVariables = {
  infoId: Scalars['ID'];
  ids: Array<Scalars['ID']>;
};


export type MoveBooksMutation = (
  { __typename?: 'Mutation' }
  & { moveBooks: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type EditBookInfoThumbnailMutationVariables = {
  id: Scalars['ID'];
  th?: Maybe<Scalars['String']>;
};


export type EditBookInfoThumbnailMutation = (
  { __typename?: 'Mutation' }
  & { edit: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type BookPagesQueryVariables = {
  id: Scalars['ID'];
};


export type BookPagesQuery = (
  { __typename?: 'Query' }
  & { book?: Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id' | 'pages'>
  )> }
);

export type EditBookThumbnailMutationVariables = {
  id: Scalars['ID'];
  th?: Maybe<Scalars['String']>;
};


export type EditBookThumbnailMutation = (
  { __typename?: 'Mutation' }
  & { edit: (
    { __typename?: 'Result' }
    & Pick<Result, 'success' | 'code'>
  ) }
);

export type BookInfoQueryVariables = {
  id: Scalars['ID'];
  order?: Maybe<BookOrder>;
};


export type BookInfoQuery = (
  { __typename?: 'Query' }
  & { bookInfo?: Maybe<(
    { __typename?: 'BookInfo' }
    & Pick<BookInfo, 'id' | 'name'>
    & { books: Array<(
      { __typename?: 'Book' }
      & Pick<Book, 'id' | 'number' | 'pages' | 'thumbnail'>
      & { info?: Maybe<(
        { __typename?: 'BookInfo' }
        & Pick<BookInfo, 'id'>
      )> }
    )> }
  )> }
);

export type GenresQueryVariables = {};


export type GenresQuery = (
  { __typename?: 'Query' }
  & { genres: Array<(
    { __typename?: 'Genre' }
    & Pick<Genre, 'id' | 'name' | 'invisible'>
  )> }
);



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

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
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

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

export type isTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

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
  String: ResolverTypeWrapper<Scalars['String']>,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
  Upload: ResolverTypeWrapper<Scalars['Upload']>,
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>,
  IntRange: ResolverTypeWrapper<Scalars['IntRange']>,
  Query: ResolverTypeWrapper<{}>,
  Int: ResolverTypeWrapper<Scalars['Int']>,
  ID: ResolverTypeWrapper<Scalars['ID']>,
  Mutation: ResolverTypeWrapper<{}>,
  Subscription: ResolverTypeWrapper<{}>,
  BookInfoOrder: BookInfoOrder,
  BookOrder: BookOrder,
  SplitType: SplitType,
  BookInfo: ResolverTypeWrapper<BookInfo>,
  Book: ResolverTypeWrapper<Book>,
  BookInfoList: ResolverTypeWrapper<BookInfoList>,
  Result: ResolverTypeWrapper<Result>,
  ResultWithInfoId: ResolverTypeWrapper<ResultWithInfoId>,
  ResultWithBookResults: ResolverTypeWrapper<ResultWithBookResults>,
  BookInfoResult: ResolverTypeWrapper<BookInfoResult>,
  Plugin: ResolverTypeWrapper<Plugin>,
  PluginInfo: ResolverTypeWrapper<PluginInfo>,
  PluginQueries: ResolverTypeWrapper<PluginQueries>,
  CommonPluginQuery: ResolverTypeWrapper<CommonPluginQuery>,
  Genre: ResolverTypeWrapper<Genre>,
  InputBook: InputBook,
  BookInfoHistory: BookInfoHistory,
  Debug_FolderSizes: ResolverTypeWrapper<Debug_FolderSizes>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  String: Scalars['String'],
  Boolean: Scalars['Boolean'],
  Upload: Scalars['Upload'],
  BigInt: Scalars['BigInt'],
  IntRange: Scalars['IntRange'],
  Query: {},
  Int: Scalars['Int'],
  ID: Scalars['ID'],
  Mutation: {},
  Subscription: {},
  BookInfoOrder: BookInfoOrder,
  BookOrder: BookOrder,
  SplitType: SplitType,
  BookInfo: BookInfo,
  Book: Book,
  BookInfoList: BookInfoList,
  Result: Result,
  ResultWithInfoId: ResultWithInfoId,
  ResultWithBookResults: ResultWithBookResults,
  BookInfoResult: BookInfoResult,
  Plugin: Plugin,
  PluginInfo: PluginInfo,
  PluginQueries: PluginQueries,
  CommonPluginQuery: CommonPluginQuery,
  Genre: Genre,
  InputBook: InputBook,
  BookInfoHistory: BookInfoHistory,
  Debug_FolderSizes: Debug_FolderSizes,
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload'
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt'
}

export interface IntRangeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IntRange'], any> {
  name: 'IntRange'
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  bookInfos?: Resolver<ResolversTypes['BookInfoList'], ParentType, ContextType, RequireFields<QueryBookInfosArgs, 'length' | 'offset' | 'genres' | 'order'>>,
  bookInfo?: Resolver<Maybe<ResolversTypes['BookInfo']>, ParentType, ContextType, RequireFields<QueryBookInfoArgs, 'id'>>,
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<QueryBooksArgs, 'offset' | 'limit' | 'order'>>,
  book?: Resolver<Maybe<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<QueryBookArgs, 'id'>>,
  debug_folderSize?: Resolver<ResolversTypes['Debug_FolderSizes'], ParentType, ContextType>,
  plugins?: Resolver<Array<ResolversTypes['Plugin']>, ParentType, ContextType>,
  genres?: Resolver<Array<ResolversTypes['Genre']>, ParentType, ContextType>,
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addBookInfo?: Resolver<ResolversTypes['ResultWithInfoId'], ParentType, ContextType, RequireFields<MutationAddBookInfoArgs, 'name'>>,
  editBookInfo?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditBookInfoArgs, 'id'>>,
  deleteBookInfo?: Resolver<ResolversTypes['BookInfoResult'], ParentType, ContextType, RequireFields<MutationDeleteBookInfoArgs, 'id'>>,
  addBookInfoHistories?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationAddBookInfoHistoriesArgs, 'histories'>>,
  addBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationAddBookArgs, 'id' | 'number' | 'file'>>,
  addBooks?: Resolver<Array<ResolversTypes['Result']>, ParentType, ContextType, RequireFields<MutationAddBooksArgs, 'id' | 'books'>>,
  addCompressBook?: Resolver<ResolversTypes['ResultWithBookResults'], ParentType, ContextType, RequireFields<MutationAddCompressBookArgs, 'id' | 'file'>>,
  editBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditBookArgs, 'id'>>,
  deleteBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationDeleteBookArgs, 'id'>>,
  deleteBooks?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationDeleteBooksArgs, 'infoId' | 'ids'>>,
  moveBooks?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationMoveBooksArgs, 'infoId' | 'ids'>>,
  deletePages?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationDeletePagesArgs, 'id' | 'pages'>>,
  splitPages?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationSplitPagesArgs, 'id' | 'pages' | 'type'>>,
  editPage?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditPageArgs, 'id' | 'page' | 'image'>>,
  putPage?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationPutPageArgs, 'id' | 'beforePage' | 'image'>>,
  debug_deleteUnusedFolders?: Resolver<ResolversTypes['Result'], ParentType, ContextType>,
  deleteGenre?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationDeleteGenreArgs, 'genre'>>,
  editGenre?: Resolver<ResolversTypes['Result'], ParentType, ContextType, RequireFields<MutationEditGenreArgs, 'oldName'>>,
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  addBookInfo?: SubscriptionResolver<ResolversTypes['String'], "addBookInfo", ParentType, ContextType, RequireFields<SubscriptionAddBookInfoArgs, 'name'>>,
  addBooks?: SubscriptionResolver<ResolversTypes['String'], "addBooks", ParentType, ContextType, RequireFields<SubscriptionAddBooksArgs, 'id'>>,
};

export type BookInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfo'] = ResolversParentTypes['BookInfo']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  history?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  genres?: Resolver<Array<ResolversTypes['Genre']>, ParentType, ContextType>,
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType, RequireFields<BookInfoBooksArgs, 'order'>>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type BookResolvers<ContextType = any, ParentType extends ResolversParentTypes['Book'] = ResolversParentTypes['Book']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  pages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  info?: Resolver<Maybe<ResolversTypes['BookInfo']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type BookInfoListResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoList'] = ResolversParentTypes['BookInfoList']> = {
  hasNext?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  infos?: Resolver<Array<ResolversTypes['BookInfo']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['Result'] = ResolversParentTypes['Result']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ResultWithInfoIdResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResultWithInfoId'] = ResolversParentTypes['ResultWithInfoId']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  infoId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ResultWithBookResultsResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResultWithBookResults'] = ResolversParentTypes['ResultWithBookResults']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  bookResults?: Resolver<Maybe<Array<ResolversTypes['Result']>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type BookInfoResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['BookInfoResult'] = ResolversParentTypes['BookInfoResult']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PluginResolvers<ContextType = any, ParentType extends ResolversParentTypes['Plugin'] = ResolversParentTypes['Plugin']> = {
  info?: Resolver<ResolversTypes['PluginInfo'], ParentType, ContextType>,
  queries?: Resolver<ResolversTypes['PluginQueries'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PluginInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PluginInfo'] = ResolversParentTypes['PluginInfo']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PluginQueriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['PluginQueries'] = ResolversParentTypes['PluginQueries']> = {
  add?: Resolver<ResolversTypes['CommonPluginQuery'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type CommonPluginQueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['CommonPluginQuery'] = ResolversParentTypes['CommonPluginQuery']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  args?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>,
  subscription?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type GenreResolvers<ContextType = any, ParentType extends ResolversParentTypes['Genre'] = ResolversParentTypes['Genre']> = {
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  invisible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type Debug_FolderSizesResolvers<ContextType = any, ParentType extends ResolversParentTypes['Debug_FolderSizes'] = ResolversParentTypes['Debug_FolderSizes']> = {
  tmp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  cache?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  book?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  unusedBook?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  bookInfoCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  bookCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type Resolvers<ContextType = any> = {
  Upload?: GraphQLScalarType,
  BigInt?: GraphQLScalarType,
  IntRange?: GraphQLScalarType,
  Query?: QueryResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
  Subscription?: SubscriptionResolvers<ContextType>,
  BookInfo?: BookInfoResolvers<ContextType>,
  Book?: BookResolvers<ContextType>,
  BookInfoList?: BookInfoListResolvers<ContextType>,
  Result?: ResultResolvers<ContextType>,
  ResultWithInfoId?: ResultWithInfoIdResolvers<ContextType>,
  ResultWithBookResults?: ResultWithBookResultsResolvers<ContextType>,
  BookInfoResult?: BookInfoResultResolvers<ContextType>,
  Plugin?: PluginResolvers<ContextType>,
  PluginInfo?: PluginInfoResolvers<ContextType>,
  PluginQueries?: PluginQueriesResolvers<ContextType>,
  CommonPluginQuery?: CommonPluginQueryResolvers<ContextType>,
  Genre?: GenreResolvers<ContextType>,
  Debug_FolderSizes?: Debug_FolderSizesResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
