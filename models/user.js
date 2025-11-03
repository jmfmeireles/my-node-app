import { DataTypes } from "sequelize";
import sequelize from "../utils/dbConnection.js";

const User = sequelize.define(
    "User",
    {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { msg: "This username already exists." },
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
        timestamps: true,
        paranoid: true,
    }
);

export default User;