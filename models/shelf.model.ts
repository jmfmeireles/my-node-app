import { DataTypes, Model, type CreationOptional, type Optional } from "sequelize";
import sequelize from "../config/db.ts";

interface ShelfAttributes {
    id?: number;
    name: string;
  }
  
  interface ShelfCreationAttributes extends Optional<ShelfAttributes, "id"> {}
  
  class Shelf
    extends Model<ShelfAttributes, ShelfCreationAttributes>
    implements ShelfAttributes
  {
    declare id: number;
    declare name: string;
  
    // timestamps!
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
  }
  
  // Shelf model
  Shelf.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Shelf name must not be empty." },
        },
      },
    },
    {
      sequelize,
      timestamps: false,
    }
  );

export { Shelf, type ShelfCreationAttributes };