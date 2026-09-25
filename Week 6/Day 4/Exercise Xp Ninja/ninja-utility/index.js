const { Command } = require('commander');
const greet = require('./commands/greet');
const fetchPosts = require('./commands/fetch');
const readFile = require('./commands/read');

const program = new Command();

program
  .name('ninja-utility')
  .description('A small command-line utility for common tasks.');

program
  .command('greet [name]')
  .description('Display a colorful greeting')
  .action(greet);

program
  .command('fetch')
  .description('Fetch and display public posts')
  .option('-l, --limit <number>', 'number of posts to display', '5')
  .action((options) => fetchPosts(options.limit).catch((error) => {
    console.error(`Unable to fetch posts: ${error.message}`);
    process.exitCode = 1;
  }));

program
  .command('read <file>')
  .description('Read and display a file')
  .action(readFile);

program.parseAsync(process.argv);
