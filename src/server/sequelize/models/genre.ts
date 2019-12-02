import { Association, DataTypes, Model } from 'sequelize';
import bookInfo from './bookInfo';

export default class genre extends Model {
  public id!: string;

  public name!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public infos?: bookInfo[];

  public static associations: {
    infos: Association<genre, bookInfo>;
  };

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    genre.init({
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        unique: 'unique_name',
        type: DataTypes.STRING,
      },
    }, {
      sequelize,
      tableName: 'genres',
      timestamps: false,
    });
    return 'genres';
  }

  public static associate() {
    genre.belongsToMany(bookInfo, {
      through: 'infoGenres',
      foreignKey: 'genreId',
      as: 'infos',
      timestamps: false,
    });
  }

  public static async seed() {
    await genre.upsert({ name: 'Invisible' });
    await genre.upsert({ name: 'Finished' });
  }
}
