import { DataTypes, Association, Model } from 'sequelize';
import genre from './genre';
import bookInfo from './bookInfo';

export default class infoGenre extends Model {
  public id!: number;

  public infoId!: string;

  public genreId!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly genre?: genre;

  public readonly info?: bookInfo;

  public static associations: {
    genre: Association<infoGenre, genre>;
    info: Association<infoGenre, bookInfo>;
  };

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    infoGenre.init({
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },
      infoId: {
        allowNull: false,
        unique: 'infoGenres-info-genre',
        type: DataTypes.UUID,
      },
      genreId: {
        allowNull: false,
        unique: 'infoGenres-info-genre',
        type: DataTypes.INTEGER,
      },
    }, {
      sequelize,
      tableName: 'infoGenres',
      timestamps: false,
    });
    return 'infoGenres';
  }

  public static associate() {
    infoGenre.belongsTo(genre, { foreignKey: 'genreId', as: 'genre' });
    infoGenre.belongsTo(bookInfo, { foreignKey: 'infoId', as: 'info' });
  }
}
