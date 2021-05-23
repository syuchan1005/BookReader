import { DataTypes, Association, Model } from 'sequelize';
import Book from './Book';
import Genre from './Genre';

export default class BookInfo extends Model {
  public id!: string;

  public name!: string;

  public thumbnail: number | null;

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

  public static async hasId(infoId: string): Promise<boolean> {
    const a = await BookInfo.findAll({
      attributes: ['id'],
      where: {
        id: infoId,
      },
      limit: 1,
    });
    return (a && a.length > 0);
  }

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
