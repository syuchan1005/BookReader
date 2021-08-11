import { Association, DataTypes, Model } from 'sequelize';
import { defaultGenres } from '@syuchan1005/book-reader-common';
import BookInfo from './BookInfo';
import { restoreSequelizeAttributesOnClass } from '../ModelHelper';

export default class Genre extends Model {
  constructor(...args) {
    super(...args);
    restoreSequelizeAttributesOnClass(new.target, this);
  }

  public id!: number;

  public invisible!: boolean;

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
      invisible: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
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
    await Promise.all(defaultGenres.map((name) => Genre.upsert({ name, invisible: name === 'Invisible' })));
  }
}
