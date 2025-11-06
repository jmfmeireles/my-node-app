import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../utils/dbConnection.ts";

interface UserAttributes {
    id?: number;
    username: string;
    password: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public username!: string;
    public password!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

User.init(
    {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { name: "unique", msg: "This username already exists." },
            validate: {
                notEmpty: { msg: "Username must not be empty" },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: true,
        paranoid: true,
    }
);

export default User;