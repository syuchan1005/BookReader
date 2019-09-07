import { DataTypes, Association, Model } from 'sequelize';
import book from './book';

export default class bookInfo extends Model {
  public id!: string;

  public name!: string;

  public thumbnail: string | null;

  public count!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly deletedAt: Date | null;

  public readonly books?: book[];

  public static associations: {
    books: Association<bookInfo, book>;
  };

  public static async hasId(infoId: string): Promise<boolean> {
    const a = await bookInfo.findAll({
      attributes: ['id'],
      where: {
        id: infoId,
      },
      limit: 1,
    });
    return (a && a.length > 0);
  }

  public static initModel(sequelize) {
    bookInfo.init({
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      thumbnail: {
        type: DataTypes.STRING,
      },
      count: {
        allowNull: false,
        defaultValue: 0,
        type: DataTypes.INTEGER,
      },
    }, {
      sequelize,
      tableName: 'bookInfos',
      paranoid: true,
    });
    return 'bookInfo';
  }

  public static associate() {
    bookInfo.hasMany(book, { foreignKey: 'infoId', as: 'books' });
  }
}
