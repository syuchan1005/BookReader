import { DataTypes, Association, Model } from 'sequelize';
import book from './book';
import genre from './genre';

export default class bookInfo extends Model {
  public id!: string;

  public name!: string;

  public thumbnail: string | null;

  public count!: number;

  public history!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public books?: book[];

  public genres?: genre[];

  public static associations: {
    books: Association<bookInfo, book>;
    genres: Association<bookInfo, genre>;
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

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    bookInfo.init({
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
        type: DataTypes.STRING,
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
    bookInfo.hasMany(book, { foreignKey: 'infoId', as: 'books' });
    bookInfo.belongsToMany(genre, {
      through: 'infoGenres',
      foreignKey: 'infoId',
      as: 'genres',
      timestamps: false,
    });
  }
}
