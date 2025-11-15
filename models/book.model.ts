import {
  DataTypes,
  Model,
  type CreationOptional,
  type HasManyAddAssociationMixin,
  type HasManyGetAssociationsMixin,
  type HasManyHasAssociationMixin,
  type HasManyRemoveAssociationMixin,
  type NonAttribute,
  type Optional,
} from "sequelize";
import sequelize from "../config/db.ts";
import { Shelf } from "./shelf.model.ts";

interface BookAttributes {
  id?: number;
  title: string;
  publicationYear?: number;
  authorId?: number;
}

interface CreateUpdateBookAttributes extends Omit<BookAttributes, "id"> {
  shelfIds?: number[];
}

type BookCreationAttributes = Optional<BookAttributes, "id">;

class Book
  extends Model<BookAttributes, BookCreationAttributes>
  implements BookAttributes
{
  declare id: CreationOptional<number>;
  declare title: string;
  declare publicationYear?: number;
  declare authorId?: number;

  // timestamps!
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  //shelves association
  declare readonly shelves?: NonAttribute<Shelf[]>;

  //association methods for shelves
  declare getShelves: HasManyGetAssociationsMixin<Shelf>;
  declare addShelves: HasManyAddAssociationMixin<Shelf[], number>;
  declare removeShelf: HasManyRemoveAssociationMixin<Shelf, number>;
  declare removeShelves: HasManyRemoveAssociationMixin<Shelf[], number>;
  declare hasShelf: HasManyHasAssociationMixin<Shelf, number>;
  declare setShelves: HasManyAddAssociationMixin<Shelf[], number>;
}

// Book model
Book.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Title is required." },
        notEmpty: { msg: "Title must not be empty." },
      },
    },
    publicationYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Publication year is required." },
        isInt: { msg: "Publication year must be a valid integer." },
      },
    },
  },
  {
    sequelize,
    timestamps: true, // Enable timestamps
    paranoid: true, // Enable soft deletes
    deletedAt: "deletedAt", // Custom name for the deleted timestamp column
  }
);
//Associations
// Many-to-Many: Books ↔ Shelves
Book.belongsToMany(Shelf, {
  through: "BookShelves",
  as: "shelves",
  foreignKey: "bookId",
});

Shelf.belongsToMany(Book, {
  through: "BookShelves",
  as: "books",
  foreignKey: "shelfId",
});

export { Book, type CreateUpdateBookAttributes };
