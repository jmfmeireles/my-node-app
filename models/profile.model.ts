import {
  DataTypes,
  Model,
  type CreationOptional,
  type Optional,
} from "sequelize";
import sequelize from "../config/db.ts";

interface ProfileAttributes {
  id?: number;
  biography?: string;
  authorId?: number;
}

interface ProfileCreationAttributes extends Optional<ProfileAttributes, "id"> {}

class Profile
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  declare id: CreationOptional<number>;
  declare biography: string;
  declare authorId?: number;

  // timestamps!
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

// Profile model
Profile.init(
  {
    biography: {
      type: DataTypes.TEXT, // Detailed biography
      allowNull: true,
    },
  },
  {
    sequelize, // Add the sequelize instance
    timestamps: false,
  }
);

export { Profile, type ProfileCreationAttributes };
