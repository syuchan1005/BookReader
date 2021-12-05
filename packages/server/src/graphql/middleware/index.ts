import Book from './Book';
import BookInfo from './BookInfo';
import Debug from './Debug';
import Genre from './Genre';
import Page from './Page';
import RelayBookInfo from './RelayBookInfo';
import Auth0 from './Auth0';

export default {
  Book: new Book(),
  BookInfo: new BookInfo(),
  Debug: new Debug(),
  Genre: new Genre(),
  Page: new Page(),
  RelayBookInfo: new RelayBookInfo(),
  Auth0: new Auth0(),
};
