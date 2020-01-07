
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';


export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  BigInt: number,
  Upload: Promise<{ filename: string, mimetype: string, encoding: string, createReadStream: () => NodeJS.ReadableStream }>,
  IntRange: (number | [number, number])[],
};


export type Book = {
  id: Scalars['ID'],
  thumbnail?: Maybe<Scalars['String']>,
  number: Scalars['String'],
  pages: Scalars['Int'],
  /** infoId: ID! */
  info?: Maybe<BookInfo>,
};

export type BookInfo = {
  id: Scalars['ID'],
  name: Scalars['String'],
  thumbnail?: Maybe<Scalars['String']>,
  count: Scalars['Int'],
  history: Scalars['Boolean'],
  genres: Array<Scalars['String']>,
  books: Array<Book>,
};


export type BookInfoBooksArgs = {
  order: BookOrder
};

export type BookInfoHistory = {
  name: Scalars['String'],
  count: Scalars['Int'],
};

export type BookInfoList = {
  length: Scalars['Int'],
  infos: Array<BookInfo>,
};

export enum BookInfoOrder {
  UpdateNewest = 'Update_Newest',
  UpdateOldest = 'Update_Oldest',
  AddNewest = 'Add_Newest',
  AddOldest = 'Add_Oldest',
  NameAsc = 'Name_Asc',
  NameDesc = 'Name_Desc'
}

export type BookInfoResult = {
  success: Scalars['Boolean'],
  code?: Maybe<Scalars['String']>,
  message?: Maybe<Scalars['String']>,
  books: Array<Book>,
};

export enum BookOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type CommonPluginQuery = {
  name: Scalars['String'],
  args: Array<Scalars['String']>,
  subscription?: Maybe<Scalars['Boolean']>,
};

export type Debug_FolderSizes = {
  tmp: Scalars['BigInt'],
  cache: Scalars['BigInt'],
  book: Scalars['BigInt'],
  unusedBook: Scalars['BigInt'],
  bookInfoCount: Scalars['Int'],
  bookCount: Scalars['Int'],
};

export type InputBook = {
  number: Scalars['String'],
  file: Scalars['Upload'],
};


export type Mutation = {
  /** # BookInfo */
  addBookInfo: ResultWithInfoId,
  editBookInfo: Result,
  deleteBookInfo: BookInfoResult,
  addBookInfoHistories: Result,
  /** # Book */
  addBook: Result,
  addBooks: Array<Result>,
  addCompressBook: ResultWithBookResults,
  editBook: Result,
  deleteBook: Result,
  /** # Page */
  deletePages: Result,
  splitPages: Result,
  editPage: Result,
  /** if beforePage 0   -> 0, put, 1
   * if beforePage -1  -> put, 0, 1
   * if beforePage 100 -> 100, put, 101
 */
  putPage: Result,
  /** # Debug */
  debug_deleteUnusedFolders: Result,
};


export type MutationAddBookInfoArgs = {
  name: Scalars['String'],
  thumbnail?: Maybe<Scalars['Upload']>,
  genres?: Maybe<Array<Scalars['String']>>
};


export type MutationEditBookInfoArgs = {
  id: Scalars['ID'],
  name?: Maybe<Scalars['String']>,
  thumbnail?: Maybe<Scalars['String']>,
  genres?: Maybe<Array<Scalars['String']>>
};


export type MutationDeleteBookInfoArgs = {
  id: Scalars['ID']
};


export type MutationAddBookInfoHistoriesArgs = {
  histories: Array<BookInfoHistory>
};


export type MutationAddBookArgs = {
  id: Scalars['ID'],
  number: Scalars['String'],
  file: Scalars['Upload']
};


export type MutationAddBooksArgs = {
  id: Scalars['ID'],
  books: Array<InputBook>
};


export type MutationAddCompressBookArgs = {
  id: Scalars['ID'],
  file: Scalars['Upload']
};


export type MutationEditBookArgs = {
  id: Scalars['ID'],
  number?: Maybe<Scalars['String']>,
  thumbnail?: Maybe<Scalars['String']>
};


export type MutationDeleteBookArgs = {
  id: Scalars['ID']
};


export type MutationDeletePagesArgs = {
  id: Scalars['ID'],
  pages: Scalars['IntRange']
};


export type MutationSplitPagesArgs = {
  id: Scalars['ID'],
  pages: Scalars['IntRange'],
  type: SplitType
};


export type MutationEditPageArgs = {
  id: Scalars['ID'],
  page: Scalars['Int'],
  image: Scalars['Upload']
};


export type MutationPutPageArgs = {
  id: Scalars['ID'],
  beforePage: Scalars['Int'],
  image: Scalars['Upload']
};

export type Plugin = {
  info: PluginInfo,
  queries: PluginQueries,
};

export type PluginInfo = {
  name: Scalars['String'],
  version: Scalars['String'],
};

export type PluginQueries = {
  add: CommonPluginQuery,
};

export type Query = {
  /** # BookInfo */
  bookInfos: BookInfoList,
  bookInfo?: Maybe<BookInfo>,
  /** # Book */
  books: Array<Book>,
  book?: Maybe<Book>,
  /** # Debug */
  debug_folderSize: Debug_FolderSizes,
  plugins: Array<Plugin>,
  genres: Array<Scalars['String']>,
};


export type QueryBookInfosArgs = {
  limit: Scalars['Int'],
  offset: Scalars['Int'],
  search?: Maybe<Scalars['String']>,
  genres?: Maybe<Array<Scalars['String']>>,
  history: Scalars['Boolean'],
  order: BookInfoOrder
};


export type QueryBookInfoArgs = {
  id: Scalars['ID']
};


export type QueryBooksArgs = {
  id?: Maybe<Scalars['ID']>,
  offset: Scalars['Int'],
  limit: Scalars['Int'],
  order: BookOrder
};


export type QueryBookArgs = {
  id: Scalars['ID']
};

export type Result = {
  success: Scalars['Boolean'],
  code?: Maybe<Scalars['String']>,
  message?: Maybe<Scalars['String']>,
};

export type ResultWithBookResults = {
  success: Scalars['Boolean'],
  code?: Maybe<Scalars['String']>,
  message?: Maybe<Scalars['String']>,
  bookResults?: Maybe<Array<Result>>,
};

export type ResultWithInfoId = {
  success: Scalars['Boolean'],
  code?: Maybe<Scalars['String']>,
  message?: Maybe<Scalars['String']>,
  infoId?: Maybe<Scalars['ID']>,
};

export enum SplitType {
  Vertical = 'VERTICAL',
  Horizontal = 'HORIZONTAL'
}

export type Subscription = {
  addBookInfo: Scalars['String'],
  addBooks: Scalars['String'],
};


export type SubscriptionAddBookInfoArgs = {
  name: Scalars['String']
};


export type SubscriptionAddBooksArgs = {
  id: Scalars['ID']
};


export type AddBooksMutationVariables = {
  id: Scalars['ID'],
  books: Array<InputBook>
};


export type AddBooksMutation = ({ __typename?: 'Mutation' } & { adds: Array<({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>)> });

export type AddBooksProgressSubscriptionVariables = {
  id: Scalars['ID']
};


export type AddBooksProgressSubscription = ({ __typename?: 'Subscription' } & Pick<Subscription, 'addBooks'>);

export type AddCompressBookMutationVariables = {
  id: Scalars['ID'],
  file: Scalars['Upload']
};


export type AddCompressBookMutation = ({ __typename?: 'Mutation' } & { add: ({ __typename?: 'ResultWithBookResults' } & Pick<ResultWithBookResults, 'success' | 'code'>) });

export type PluginsQueryVariables = {};


export type PluginsQuery = ({ __typename?: 'Query' } & { plugins: Array<({ __typename?: 'Plugin' } & { info: ({ __typename?: 'PluginInfo' } & Pick<PluginInfo, 'name'>), queries: ({ __typename?: 'PluginQueries' } & { add: ({ __typename?: 'CommonPluginQuery' } & Pick<CommonPluginQuery, 'name' | 'args' | 'subscription'>) }) })> });

export type AddBookInfoMutationVariables = {
  name: Scalars['String']
};


export type AddBookInfoMutation = ({ __typename?: 'Mutation' } & { add: ({ __typename?: 'ResultWithInfoId' } & Pick<ResultWithInfoId, 'success' | 'code'>) });

export type AddBookInfoHistoriesMutationVariables = {
  histories: Array<BookInfoHistory>
};


export type AddBookInfoHistoriesMutation = ({ __typename?: 'Mutation' } & { add: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type DeleteUnusedFoldersMutationVariables = {};


export type DeleteUnusedFoldersMutation = ({ __typename?: 'Mutation' } & { debug_deleteUnusedFolders: ({ __typename?: 'Result' } & Pick<Result, 'success'>) });

export type FolderSizesQueryVariables = {};


export type FolderSizesQuery = ({ __typename?: 'Query' } & { sizes: ({ __typename?: 'Debug_FolderSizes' } & Pick<Debug_FolderSizes, 'tmp' | 'cache' | 'book' | 'unusedBook' | 'bookInfoCount' | 'bookCount'>) });

export type DeleteBookInfoMutationVariables = {
  id: Scalars['ID']
};


export type DeleteBookInfoMutation = ({ __typename?: 'Mutation' } & { del: ({ __typename?: 'BookInfoResult' } & Pick<BookInfoResult, 'success' | 'code'> & { books: Array<({ __typename?: 'Book' } & Pick<Book, 'id' | 'pages'>)> }) });

export type EditBookInfoMutationVariables = {
  id: Scalars['ID'],
  name?: Maybe<Scalars['String']>,
  thumbnail?: Maybe<Scalars['String']>,
  genres: Array<Scalars['String']>
};


export type EditBookInfoMutation = ({ __typename?: 'Mutation' } & { edit: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type DeleteBookMutationVariables = {
  id: Scalars['ID']
};


export type DeleteBookMutation = ({ __typename?: 'Mutation' } & { del: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type EditBookMutationVariables = {
  id: Scalars['ID'],
  number?: Maybe<Scalars['String']>,
  thumbnail?: Maybe<Scalars['String']>
};


export type EditBookMutation = ({ __typename?: 'Mutation' } & { edit: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type DeletePagesMutationVariables = {
  id: Scalars['ID'],
  pages: Scalars['IntRange']
};


export type DeletePagesMutation = ({ __typename?: 'Mutation' } & { del: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type EditPageMutationVariables = {
  id: Scalars['ID'],
  page: Scalars['Int'],
  image: Scalars['Upload']
};


export type EditPageMutation = ({ __typename?: 'Mutation' } & { edit: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type PutPageMutationVariables = {
  id: Scalars['ID'],
  beforePage: Scalars['Int'],
  image: Scalars['Upload']
};


export type PutPageMutation = ({ __typename?: 'Mutation' } & { put: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type SplitPagesMutationVariables = {
  id: Scalars['ID'],
  pages: Scalars['IntRange'],
  type?: Maybe<SplitType>
};


export type SplitPagesMutation = ({ __typename?: 'Mutation' } & { split: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type BookQueryVariables = {
  id: Scalars['ID']
};


export type BookQuery = ({ __typename?: 'Query' } & { book: Maybe<({ __typename?: 'Book' } & Pick<Book, 'id' | 'number' | 'pages'> & { info: Maybe<({ __typename?: 'BookInfo' } & Pick<BookInfo, 'id' | 'name'>)> })> });

export type BookInfosQueryVariables = {
  limit: Scalars['Int'],
  offset: Scalars['Int'],
  search?: Maybe<Scalars['String']>,
  order?: Maybe<BookInfoOrder>,
  history?: Maybe<Scalars['Boolean']>,
  genres: Array<Scalars['String']>
};


export type BookInfosQuery = ({ __typename?: 'Query' } & { bookInfos: ({ __typename?: 'BookInfoList' } & Pick<BookInfoList, 'length'> & { infos: Array<({ __typename?: 'BookInfo' } & Pick<BookInfo, 'id' | 'name' | 'count' | 'thumbnail' | 'history' | 'genres'>)> }) });

export type EditBookInfoThumbnailMutationVariables = {
  id: Scalars['ID'],
  th?: Maybe<Scalars['String']>
};


export type EditBookInfoThumbnailMutation = ({ __typename?: 'Mutation' } & { edit: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type BookPagesQueryVariables = {
  id: Scalars['ID']
};


export type BookPagesQuery = ({ __typename?: 'Query' } & { book: Maybe<({ __typename?: 'Book' } & Pick<Book, 'id' | 'pages'>)> });

export type EditBookThumbnailMutationVariables = {
  id: Scalars['ID'],
  th?: Maybe<Scalars['String']>
};


export type EditBookThumbnailMutation = ({ __typename?: 'Mutation' } & { edit: ({ __typename?: 'Result' } & Pick<Result, 'success' | 'code'>) });

export type BookInfoQueryVariables = {
  id: Scalars['ID']
};


export type BookInfoQuery = ({ __typename?: 'Query' } & { bookInfo: Maybe<({ __typename?: 'BookInfo' } & Pick<BookInfo, 'id' | 'name'> & { books: Array<({ __typename?: 'Book' } & Pick<Book, 'id' | 'number' | 'pages' | 'thumbnail'> & { info: Maybe<({ __typename?: 'BookInfo' } & Pick<BookInfo, 'id'>)> })> })> });

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>


export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;


export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

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

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>;
}

export type SubscriptionResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

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
  Query: {},
  Int: Scalars['Int'],
  String: Scalars['String'],
  Boolean: Scalars['Boolean'],
  BookInfoOrder: BookInfoOrder,
  BookInfoList: BookInfoList,
  BookInfo: BookInfo,
  ID: Scalars['ID'],
  BookOrder: BookOrder,
  Book: Book,
  Debug_FolderSizes: Debug_FolderSizes,
  BigInt: Scalars['BigInt'],
  Plugin: Plugin,
  PluginInfo: PluginInfo,
  PluginQueries: PluginQueries,
  CommonPluginQuery: CommonPluginQuery,
  Mutation: {},
  Upload: Scalars['Upload'],
  ResultWithInfoId: ResultWithInfoId,
  Result: Result,
  BookInfoResult: BookInfoResult,
  BookInfoHistory: BookInfoHistory,
  InputBook: InputBook,
  ResultWithBookResults: ResultWithBookResults,
  IntRange: Scalars['IntRange'],
  SplitType: SplitType,
  Subscription: {},
};

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt'
}

export type BookResolvers<ContextType = any, ParentType = ResolversTypes['Book']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  pages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  info?: Resolver<Maybe<ResolversTypes['BookInfo']>, ParentType, ContextType>,
};

export type BookInfoResolvers<ContextType = any, ParentType = ResolversTypes['BookInfo']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  thumbnail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  history?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  genres?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>,
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType, BookInfoBooksArgs>,
};

export type BookInfoListResolvers<ContextType = any, ParentType = ResolversTypes['BookInfoList']> = {
  length?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  infos?: Resolver<Array<ResolversTypes['BookInfo']>, ParentType, ContextType>,
};

export type BookInfoResultResolvers<ContextType = any, ParentType = ResolversTypes['BookInfoResult']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType>,
};

export type CommonPluginQueryResolvers<ContextType = any, ParentType = ResolversTypes['CommonPluginQuery']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  args?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>,
  subscription?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>,
};

export type Debug_FolderSizesResolvers<ContextType = any, ParentType = ResolversTypes['Debug_FolderSizes']> = {
  tmp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  cache?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  book?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  unusedBook?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>,
  bookInfoCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  bookCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
};

export interface IntRangeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['IntRange'], any> {
  name: 'IntRange'
}

export type MutationResolvers<ContextType = any, ParentType = ResolversTypes['Mutation']> = {
  addBookInfo?: Resolver<ResolversTypes['ResultWithInfoId'], ParentType, ContextType, MutationAddBookInfoArgs>,
  editBookInfo?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationEditBookInfoArgs>,
  deleteBookInfo?: Resolver<ResolversTypes['BookInfoResult'], ParentType, ContextType, MutationDeleteBookInfoArgs>,
  addBookInfoHistories?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationAddBookInfoHistoriesArgs>,
  addBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationAddBookArgs>,
  addBooks?: Resolver<Array<ResolversTypes['Result']>, ParentType, ContextType, MutationAddBooksArgs>,
  addCompressBook?: Resolver<ResolversTypes['ResultWithBookResults'], ParentType, ContextType, MutationAddCompressBookArgs>,
  editBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationEditBookArgs>,
  deleteBook?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationDeleteBookArgs>,
  deletePages?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationDeletePagesArgs>,
  splitPages?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationSplitPagesArgs>,
  editPage?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationEditPageArgs>,
  putPage?: Resolver<ResolversTypes['Result'], ParentType, ContextType, MutationPutPageArgs>,
  debug_deleteUnusedFolders?: Resolver<ResolversTypes['Result'], ParentType, ContextType>,
};

export type PluginResolvers<ContextType = any, ParentType = ResolversTypes['Plugin']> = {
  info?: Resolver<ResolversTypes['PluginInfo'], ParentType, ContextType>,
  queries?: Resolver<ResolversTypes['PluginQueries'], ParentType, ContextType>,
};

export type PluginInfoResolvers<ContextType = any, ParentType = ResolversTypes['PluginInfo']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type PluginQueriesResolvers<ContextType = any, ParentType = ResolversTypes['PluginQueries']> = {
  add?: Resolver<ResolversTypes['CommonPluginQuery'], ParentType, ContextType>,
};

export type QueryResolvers<ContextType = any, ParentType = ResolversTypes['Query']> = {
  bookInfos?: Resolver<ResolversTypes['BookInfoList'], ParentType, ContextType, QueryBookInfosArgs>,
  bookInfo?: Resolver<Maybe<ResolversTypes['BookInfo']>, ParentType, ContextType, QueryBookInfoArgs>,
  books?: Resolver<Array<ResolversTypes['Book']>, ParentType, ContextType, QueryBooksArgs>,
  book?: Resolver<Maybe<ResolversTypes['Book']>, ParentType, ContextType, QueryBookArgs>,
  debug_folderSize?: Resolver<ResolversTypes['Debug_FolderSizes'], ParentType, ContextType>,
  plugins?: Resolver<Array<ResolversTypes['Plugin']>, ParentType, ContextType>,
  genres?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>,
};

export type ResultResolvers<ContextType = any, ParentType = ResolversTypes['Result']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
};

export type ResultWithBookResultsResolvers<ContextType = any, ParentType = ResolversTypes['ResultWithBookResults']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  bookResults?: Resolver<Maybe<Array<ResolversTypes['Result']>>, ParentType, ContextType>,
};

export type ResultWithInfoIdResolvers<ContextType = any, ParentType = ResolversTypes['ResultWithInfoId']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  infoId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
};

export type SubscriptionResolvers<ContextType = any, ParentType = ResolversTypes['Subscription']> = {
  addBookInfo?: SubscriptionResolver<ResolversTypes['String'], ParentType, ContextType, SubscriptionAddBookInfoArgs>,
  addBooks?: SubscriptionResolver<ResolversTypes['String'], ParentType, ContextType, SubscriptionAddBooksArgs>,
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload'
}

export type Resolvers<ContextType = any> = {
  BigInt?: GraphQLScalarType,
  Book?: BookResolvers<ContextType>,
  BookInfo?: BookInfoResolvers<ContextType>,
  BookInfoList?: BookInfoListResolvers<ContextType>,
  BookInfoResult?: BookInfoResultResolvers<ContextType>,
  CommonPluginQuery?: CommonPluginQueryResolvers<ContextType>,
  Debug_FolderSizes?: Debug_FolderSizesResolvers<ContextType>,
  IntRange?: GraphQLScalarType,
  Mutation?: MutationResolvers<ContextType>,
  Plugin?: PluginResolvers<ContextType>,
  PluginInfo?: PluginInfoResolvers<ContextType>,
  PluginQueries?: PluginQueriesResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  Result?: ResultResolvers<ContextType>,
  ResultWithBookResults?: ResultWithBookResultsResolvers<ContextType>,
  ResultWithInfoId?: ResultWithInfoIdResolvers<ContextType>,
  Subscription?: SubscriptionResolvers<ContextType>,
  Upload?: GraphQLScalarType,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
