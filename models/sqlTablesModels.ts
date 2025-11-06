import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../utils/dbConnection.ts";

interface GetAge {
  (dateOfBirth: Date | string | undefined): number;
}

const getAge: GetAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

interface AuthorAttributes {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: Date;
    //calculated fields
    fullName?: string;
    age?: number;
}

interface AuthorCreationAttributes extends Optional<AuthorAttributes, 'id'> {}

class Author extends Model<AuthorAttributes, AuthorCreationAttributes> implements AuthorAttributes {
    public firstName!: string;
    public lastName!: string;
    public email!: string;
    public dateOfBirth?: Date;
    public fullName?: string; // Add fullName property

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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
            get(): string { // Specify the return type as string
                return `${this.dataValues.firstName} ${this.dataValues.lastName}`;
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { name: "unique_email", msg: "This email address already exists." },
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
            beforeCreate: (author, options) => {
                console.log(`Creating author: ${author.dataValues.fullName}`);
            },
            beforeDestroy: (author, options) => {
                console.log(`Deleting author: ${author.dataValues.fullName}`);
            }
        },
    }
);

interface ProfileAttributes {
    id?: number;
    biography?: string;
    authorId?: number;
}

interface ProfileCreationAttributes extends Optional<ProfileAttributes, 'id'> {}

class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> implements ProfileAttributes {
    public biography?: string;
    public authorId?: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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

interface BookAttributes {
    id?: number;
    title: string;
    publicationYear?: number;
    authorId?: number;
}

interface BookCreationAttributes extends Optional<BookAttributes, 'id'> {}

class Book extends Model<BookAttributes, BookCreationAttributes> implements BookAttributes {
    public title!: string;
    public publicationYear?: number;
    public authorId?: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    //association methods for shelves
    declare getShelves: () => Promise<Shelf[]>;
    declare addShelves: (shelves: Shelf[]) => Promise<void>;
    declare removeShelves: (shelves: Shelf[]) => Promise<void>;
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

interface ShelfAttributes {
    id?: number;
    name: string;
}

interface ShelfCreationAttributes extends Optional<ShelfAttributes, 'id'> {}

class Shelf extends Model<ShelfAttributes, ShelfCreationAttributes> implements ShelfAttributes {
    public name!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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

// Relationships

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

export { Author, Profile, Book, Shelf };
