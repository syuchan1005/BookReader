import { DataTypes, Association, Model } from 'sequelize';
import { bookInfo } from './bookInfo';

export class book extends Model {
  public id!: string;

  public thumbnail!: string;

  public number!: number;

  public pages!: number;

  public infoId!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly info?: bookInfo;

  public static associations: {
    info: Association<book, bookInfo>;
  }
}

export const init = (sequelize) => {
  const tableName = 'bookInfos';
  bookInfo.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    pages: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    infoId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    tableName,
  });
  return tableName;
};

export const associate = () => {
  book.hasOne(bookInfo, { foreignKey: 'infoId' });
};
