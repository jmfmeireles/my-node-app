
import sequelize from '../config/db.ts';
import { Author } from '../models/author.model.ts';
import { Book } from '../models/book.model.ts';
import { Profile } from '../models/profile.model.ts';
import { Shelf } from '../models/shelf.model.ts';


const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced!');

    // Seed authors
    const authors = await Author.bulkCreate([
      { firstName: 'John', lastName: 'Doe', email: 'john@example.com', dateOfBirth: new Date('1980-01-01') },
      { firstName: 'Jane', lastName: "Smith", email: 'jane@example.com', dateOfBirth: new Date('1990-02-02') },
      { firstName: 'Emily', lastName: "Johnson", email: 'emily@example.com', dateOfBirth: new Date('1985-03-03') },
    ]);
    console.log('Authors seeded:', authors.map(author => author.toJSON()));

    // Seed profiles and associate them with authors
    const profiles = await Profile.bulkCreate([
      { biography: 'John is a seasoned writer with a passion for adventure.', authorId: authors[0]?.dataValues.id! },
      { biography: 'Jane specializes in mystery novels and thrillers.', authorId: authors[1]?.dataValues.id! },
      { biography: 'Emily writes about science and exploration.', authorId: authors[2]?.dataValues.id! },
    ]);
    console.log('Profiles seeded:', profiles.map(profile => profile.toJSON()));

    // Seed books and associate them with authors
    const books = await Book.bulkCreate([
      { title: 'The Great Adventure', publicationYear: 2015, authorId: authors[0]?.dataValues.id! },
      { title: 'Mystery of the Lost City', publicationYear: 2010, authorId: authors[0]?.dataValues.id!},
      { title: 'Adventures in Coding', publicationYear: 2020, authorId: authors[1]?.dataValues.id! },
      { title: 'The Last Frontier', publicationYear: 2005, authorId: authors[1]?.dataValues.id! },
      { title: 'Exploring the Cosmos', publicationYear: 2022, authorId: authors[2]?.dataValues.id! },
      { title: 'Ancient Civilizations', publicationYear: 2018, authorId: authors[2]?.dataValues.id! },
    ]);
    console.log('Books seeded:', books.map(book => book.toJSON()));

    // Seed shelves
    const shelves = await Shelf.bulkCreate([
      { name: 'Fiction' },
      { name: 'Non-Fiction' },
      { name: 'Adventure' },
      { name: 'Science' },
    ]);
    console.log('Shelves seeded:', shelves.map(shelf => shelf.toJSON()));

    // Associate books with shelves (many-to-many)
    await books[0]?.addShelves([shelves[0]!, shelves[2]!]); 
    await books[1]?.addShelves([shelves[2]!]); 
    await books[2]?.addShelves([shelves[3]!]); 
    await books[3]?.addShelves([shelves[0]!, shelves[2]!]); 
    await books[4]?.addShelves([shelves[3]!]); 
    await books[5]?.addShelves([shelves[1]!, shelves[3]!]);

    console.log('Books associated with shelves!');

    process.exit(); 
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
