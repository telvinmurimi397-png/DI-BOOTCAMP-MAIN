// 1. Interface Book
interface Book {
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  genre?: string; // Optional property
}

// 2. Class Library
class Library {
  // Access modifier changed to protected so derived classes (like DigitalLibrary) can access the books array
  protected books: Book[] = [];

  public addBook(book: Book): void {
    this.books.push(book);
    console.log(`Added "${book.title}" to the library.`);
  }

  public getBookDetails(isbn: string): Book | string {
    const book = this.books.find((b) => b.isbn === isbn);
    if (book) {
      return book;
    }
    return `Book with ISBN ${isbn} not found.`;
  }
}

// 3. Class DigitalLibrary extending Library
class DigitalLibrary extends Library {
  public readonly website: string;

  constructor(website: string) {
    super();
    this.website = website;
  }

  public listBooks(): string[] {
    return this.books.map((book) => book.title);
  }
}

// --- Demonstration and Testing ---

// Create an instance of DigitalLibrary
const myDigitalLibrary = new DigitalLibrary("https://elibrary.example.com");

console.log(`Digital Library Website: ${myDigitalLibrary.website}\n`);

// Add books to the library
myDigitalLibrary.addBook({
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  isbn: "9780743273565",
  publishedYear: 1925,
  genre: "Fiction",
});

myDigitalLibrary.addBook({
  title: "1984",
  author: "George Orwell",
  isbn: "9780451524935",
  publishedYear: 1949,
});

myDigitalLibrary.addBook({
  title: "Clean Code",
  author: "Robert C. Martin",
  isbn: "9780132350884",
  publishedYear: 2008,
  genre: "Software Engineering",
});

console.log("\n--- List of All Book Titles ---");
console.log(myDigitalLibrary.listBooks());

console.log("\n--- Book Details Lookup ---");
// Lookup an existing book
console.log(myDigitalLibrary.getBookDetails("9780451524935"));

// Lookup a non-existing book
console.log(myDigitalLibrary.getBookDetails("0000000000000"));