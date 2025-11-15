import { DataTypes, Model, type Optional, type CreationOptional, type NonAttribute } from "sequelize";
import sequelize from "../config/db.ts";
import { getAge } from "../utils/ageCalculator.ts";
import { Book } from "./book.model.ts";
import { Profile } from "./profile.model.ts";

interface AuthorAttributes {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    //calculated fields
    fullName?: string;
    age?: number;
  }
  
 interface CreateUpdateAuthorAttributes extends Omit<AuthorAttributes, "id" | "fullName" | "age"> {
    biography?: string;
  }
  
  type AuthorCreationAttributes = Optional<AuthorAttributes, "id">;
  
  class Author
    extends Model<AuthorAttributes, AuthorCreationAttributes>
    implements AuthorAttributes
  {
    declare id: CreationOptional<number>;
    declare firstName: string;
    declare lastName: string;
    declare email: string;
    declare dateOfBirth: Date;
    declare fullName?: string;
    declare age?: number;
  
    //books association
    declare readonly books?: NonAttribute<Book[]>;
  
    // timestamps!
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;

    //methods
    declare bulkCreate: (Model<AuthorAttributes, AuthorCreationAttributes> & {
      (records: CreateUpdateAuthorAttributes[]): Promise<Author[]>;
    });
    declare init: typeof Model.init;
  }

  Author.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "First name must not be empty" },
          notNull: { msg: "First name is required." },
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Last name must not be empty" },
          notNull: { msg: "Last name is required." },
        },
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get(): string {
          // Specify the return type as string
          return `${this.dataValues.firstName} ${this.dataValues.lastName}`;
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          name: "unique_email",
          msg: "This email address already exists.",
        },
        validate: {
          isEmail: { msg: "Invalid email address." },
          notEmpty: { msg: "Email must not be blank." },
          notNull: { msg: "Email is required." },
        },
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: "Date of birth is required." },
          isDate: { msg: "Date of birth must be a valid date.", args: true },
          isAdult(value: Date) {
            const age: number = getAge(value);
            if (age < 10) {
              throw new Error("Author must be at least 10 years old.");
            }
          },
        },
      },
      age: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.dataValues.dateOfBirth) {
            return getAge(this.dataValues.dateOfBirth);
          }
          return null;
        },
      },
    },
    {
      sequelize,
      timestamps: true,
      paranoid: true,
      deletedAt: "deletedAt",
      hooks: {
        beforeCreate: (author: Author) => {
          console.log(`Creating author: ${author.dataValues.fullName}`);
        },
        beforeDestroy: (author: Author) => {
          console.log(`Deleting author: ${author.dataValues.fullName}`);
        },
      },
    }
  );

// Associations
// One-to-One: Author → Profile
Author.hasOne(Profile, {
    foreignKey: "authorId",
    as: "profile",
    onDelete: "CASCADE",
  });
  
  Profile.belongsTo(Author, {
    foreignKey: "authorId",
    as: "profile",
  });
  
  // One-to-Many: Author → Books
  Author.hasMany(Book, {
    foreignKey: "authorId",
    as: "books",
    onDelete: "CASCADE",
  });
  
  Book.belongsTo(Author, {
    foreignKey: "authorId",
    as: "author",
  });
  

  export { Author, type CreateUpdateAuthorAttributes };