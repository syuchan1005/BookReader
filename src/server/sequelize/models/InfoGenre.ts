import { DataTypes, Association, Model } from 'sequelize';
import GenreModel from './Genre';
import BookInfoModel from './BookInfo';

export default class InfoGenre extends Model {
  public id!: number;

  public infoId!: string;

  public genreId!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly genre?: GenreModel;

  public readonly info?: BookInfoModel;

  public static associations: {
    genre: Association<InfoGenre, GenreModel>;
    info: Association<InfoGenre, BookInfoModel>;
  };

  // noinspection JSUnusedGlobalSymbols
  public static initModel(sequelize) {
    InfoGenre.init({
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
    InfoGenre.belongsTo(GenreModel, { foreignKey: 'genreId', as: 'genre' });
    InfoGenre.belongsTo(BookInfoModel, { foreignKey: 'infoId', as: 'info' });
  }
}
