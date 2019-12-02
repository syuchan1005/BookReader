import { Association, DataTypes, Model } from 'sequelize';
import BookInfo from './BookInfo';

export default class Genre extends Model {
  public id!: string;

  public name!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public infos?: BookInfo[];

  public static associations: {
    infos: Association<Genre, BookInfo>;
  };

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    Genre.init({
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
    Genre.belongsToMany(BookInfo, {
      through: 'infoGenres',
      foreignKey: 'genreId',
      as: 'infos',
      timestamps: false,
    });
  }

  public static async seed() {
    await Genre.upsert({ name: 'Invisible' });
    await Genre.upsert({ name: 'Finished' });
  }
}
