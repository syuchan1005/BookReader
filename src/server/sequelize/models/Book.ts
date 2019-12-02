import { DataTypes, Association, Model } from 'sequelize';
import BookInfo from './BookInfo';

export default class Book extends Model {
  public id!: string;

  public thumbnail: string | null;

  public number!: string;

  public pages!: number;

  public infoId!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly info?: BookInfo;

  public static associations: {
    info: Association<Book, BookInfo>;
  };

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    Book.init({
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      thumbnail: {
        type: DataTypes.STRING,
      },
      number: {
        allowNull: false,
        unique: 'info',
        type: DataTypes.STRING,
      },
      pages: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      infoId: {
        allowNull: false,
        unique: 'info',
        type: DataTypes.UUID,
      },
    }, {
      sequelize,
      tableName: 'books',
    });
    return 'book';
  }

  public static associate() {
    Book.belongsTo(BookInfo, { foreignKey: 'infoId', as: 'info' });
  }
}
