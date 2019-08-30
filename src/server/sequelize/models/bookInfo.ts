import { DataTypes, Association, Model } from 'sequelize';
import { book } from './book';

export class bookInfo extends Model {
  public id!: string;

  public name!: string;

  public thumbnail: string | null;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly books?: book[];

  public static associations: {
    books: Association<bookInfo, book>;
  }
}

export const init = (sequelize) => {
  bookInfo.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    tableName: 'bookInfos',
  });
  return 'bookInfo';
};

export const associate = () => {
  bookInfo.hasMany(book, { foreignKey: 'infoId' });
};
