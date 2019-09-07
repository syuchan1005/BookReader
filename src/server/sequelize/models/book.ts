import { DataTypes, Association, Model } from 'sequelize';
import bookInfo from './bookInfo';

export default class book extends Model {
  public id!: string;

  public thumbnail: string | null;

  public number!: string;

  public pages!: number;

  public infoId!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly deletedAt: Date | null;

  public readonly info?: bookInfo;

  public static associations: {
    info: Association<book, bookInfo>;
  };

  public static initModel(sequelize) {
    book.init({
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
      paranoid: true,
    });
    return 'book';
  }

  public static associate() {
    book.belongsTo(bookInfo, { foreignKey: 'infoId', as: 'info' });
  }
}
