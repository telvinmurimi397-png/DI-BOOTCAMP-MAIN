const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const notes = require('./notes');

function reportResult(result) {
  console.log(result.message);
  if (result.note) {
    console.log(`Title: ${result.note.title}`);
    console.log(`Body: ${result.note.body}`);
  }
  if (result.notes) {
    if (result.notes.length === 0) {
      console.log('No notes found.');
    } else {
      result.notes.forEach((note, index) => console.log(`${index + 1}. ${note.title}`));
    }
  }
}

yargs(hideBin(process.argv))
  .scriptName('node app')
  .command('add', 'Add a note', (command) => command
    .option('title', { type: 'string', demandOption: true, describe: 'Note title' })
    .option('body', { type: 'string', demandOption: true, describe: 'Note body' }),
  (argv) => reportResult(notes.addNote(argv.title, argv.body)))
  .command('list', 'List all note titles', () => {}, () => reportResult(notes.listNotes()))
  .command('read', 'Read a note', (command) => command
    .option('title', { type: 'string', demandOption: true, describe: 'Note title' }),
  (argv) => reportResult(notes.readNote(argv.title)))
  .command('remove', 'Remove a note', (command) => command
    .option('title', { type: 'string', demandOption: true, describe: 'Note title' }),
  (argv) => reportResult(notes.removeNote(argv.title)))
  .demandCommand(1, 'command not recognized')
  .strict()
  .help()
  .fail((message, error) => {
    const normalizedMessage = message.toLowerCase();
    if (error || normalizedMessage.includes('command') || message.startsWith('Unknown argument:')) {
      console.error(normalizedMessage.includes('command') || message.startsWith('Unknown argument:')
        ? 'command not recognized'
        : message);
    } else {
      console.error(message);
    }
    process.exitCode = 1;
  })
  .parse();