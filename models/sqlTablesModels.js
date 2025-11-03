import { DataTypes } from "sequelize";
import sequelize from "../utils/dbConnection.js";

const getAge = (dateOfBirth) => {
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

const Author = sequelize.define(
    "Author",
    {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "First name must not be empty" },
            },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Last name must not be empty" },
            },
        },
        fullName: {
            type: DataTypes.VIRTUAL,
            get() {
                return `${this.firstName} ${this.lastName}`;
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { msg: "This email address already exists." },
            validate: {
                isEmail: { msg: "Invalid email address." },
                notEmpty: { msg: "Email must not be blank." },
            },
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isDate: { msg: "Date of birth must be a valid date." },
                isAdult(value) {
                    const age = getAge(value);
                    if (age < 10) {
                        throw new Error("Author must be at least 10 years old.");
                    }
                },
            },
        },
        age: {
            type: DataTypes.VIRTUAL,
            get() {
                if (this.dateOfBirth) {
                    return getAge(this.dateOfBirth);
                }
                return null;
            },
        },
    },
    {
        timestamps: true, // Enable timestamps
        paranoid: true, // Enable soft deletes
        deletedAt: "deletedAt", // Custom name for the deleted timestamp column
        hooks: {
            beforeCreate: (author, options) => {
                console.log(`Creating author: ${author.fullName}`);
            },
            beforeDestroy: (author, options) => {
                console.log(`Deleting author: ${author.fullName}`);
            }
        },
    }
);

// Profile model
const Profile = sequelize.define(
  "Profile",
  {
    biography: {
      type: DataTypes.TEXT, // Detailed biography
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

// Book model
const Book = sequelize.define(
  "Book",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Title must not be empty." },
      },
    },
    publicationYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: { msg: "Publication year must be a valid integer." },
      },
    },
  },
  {
    timestamps: true, // Enable timestamps
    paranoid: true, // Enable soft deletes
    deletedAt: "deletedAt", // Custom name for the deleted timestamp column
  }
);

// Shelf model
const Shelf = sequelize.define(
  "Shelf",
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
