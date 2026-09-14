// 1. Book structure (plain JavaScript object)

// 2. Base Class Library
class Library {
  constructor() {
    this.books = [];
  }

  addBook(book) {
    this.books.push(book);
  }

  getBookDetails(isbn) {
    const book = this.books.find((b) => b.isbn === isbn);
    if (!book) {
      return `Book with ISBN ${isbn} not found.`;
    }

    let details = `Title: ${book.title}, Author: ${book.author}, Published: ${book.publishedYear}, ISBN: ${book.isbn}`;
    if (book.genre) {
      details += `, Genre: ${book.genre}`;
    }
    return details;
  }
}

// 3. Subclass DigitalLibrary
class DigitalLibrary extends Library {
  constructor(website) {
    super();
    this.website = website;
  }

  listBooks() {
    return this.books.map((book) => book.title);
  }
}

// --- Demonstration & Testing ---

const myDigitalLibrary = new DigitalLibrary("https://my-digital-library.org");

// Adding books to the library
myDigitalLibrary.addBook({
  title: "The Hobbit",
  author: "J.R.R. Tolkien",
  isbn: "978-0261102217",
  publishedYear: 1937,
  genre: "Fantasy",
});

myDigitalLibrary.addBook({
  title: "Clean Code",
  author: "Robert C. Martin",
  isbn: "978-0132350884",
  publishedYear: 2008,
});

// Printing Website
console.log(`Library Website: ${myDigitalLibrary.website}`);

// Printing Book Details by ISBN
console.log(myDigitalLibrary.getBookDetails("978-0261102217"));
// Output: Title: The Hobbit, Author: J.R.R. Tolkien, Published: 1937, ISBN: 978-0261102217, Genre: Fantasy

console.log(myDigitalLibrary.getBookDetails("978-0132350884"));
// Output: Title: Clean Code, Author: Robert C. Martin, Published: 2008, ISBN: 978-0132350884

// Listing all book titles
console.log("All Book Titles:", myDigitalLibrary.listBooks());
// Output: All Book Titles: [ 'The Hobbit', 'Clean Code' ]