import { DataTypes, Association, Model } from 'sequelize';
import { restoreSequelizeAttributesOnClass } from '../ModelHelper';
import Book from './Book';
import Genre from './Genre';

export default class BookInfo extends Model {
  constructor(...args) {
    super(...args);
    restoreSequelizeAttributesOnClass(new.target, this);
  }

  public id!: string;

  public name!: string;

  public thumbnail!: string | null;

  public count!: number;

  public history!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public books?: Book[];

  public genres?: Genre[];

  public thumbnailBook?: Book;

  public static associations: {
    books: Association<BookInfo, Book>;
    genres: Association<BookInfo, Genre>;
    thumbnail: Association<BookInfo, Book>;
  };

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    BookInfo.init({
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      name: {
        allowNull: false,
        unique: 'name',
        type: DataTypes.STRING,
      },
      thumbnail: {
        type: DataTypes.UUIDV4,
      },
      count: {
        allowNull: false,
        defaultValue: 0,
        type: DataTypes.INTEGER,
      },
      history: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
    }, {
      sequelize,
      tableName: 'bookInfos',
    });
    return 'bookInfo';
  }

  public static associate() {
    BookInfo.hasMany(Book, { foreignKey: 'infoId', as: 'books' });
    BookInfo.belongsToMany(Genre, {
      through: 'infoGenres',
      foreignKey: 'infoId',
      as: 'genres',
      timestamps: false,
    });
    BookInfo.belongsTo(Book, {
      foreignKey: 'thumbnail',
      as: 'thumbnailBook',
      constraints: false,
    });
  }
}
