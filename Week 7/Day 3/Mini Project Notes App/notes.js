const fs = require('node:fs');
const path = require('node:path');
const _ = require('lodash');

const notesPath = path.join(__dirname, 'notes.json');

function loadNotes() {
  const contents = fs.readFileSync(notesPath, 'utf8');
  const notes = JSON.parse(contents);
  if (!Array.isArray(notes)) throw new Error('Notes file must contain a JSON array.');
  return notes;
}

function saveNotes(notes) {
  fs.writeFileSync(notesPath, `${JSON.stringify(notes, null, 2)}\n`, 'utf8');
}

function normalizeTitle(title) {
  return typeof title === 'string' ? title.trim() : '';
}

function addNote(title, body) {
  const cleanTitle = normalizeTitle(title);
  const cleanBody = typeof body === 'string' ? body.trim() : '';
  if (!cleanTitle || !cleanBody) return { message: 'A non-empty title and body are required.' };

  const savedNotes = loadNotes();
  if (_.find(savedNotes, (note) => note.title.toLowerCase() === cleanTitle.toLowerCase())) {
    return { message: 'Note already exists' };
  }

  const note = { title: cleanTitle, body: cleanBody };
  savedNotes.push(note);
  saveNotes(savedNotes);
  return { message: 'Note added', note };
}

function listNotes() {
  return { message: 'Your notes:', notes: loadNotes() };
}

function readNote(title) {
  const cleanTitle = normalizeTitle(title);
  if (!cleanTitle) return { message: 'A non-empty title is required.' };

  const note = _.find(loadNotes(), (item) => item.title.toLowerCase() === cleanTitle.toLowerCase());
  return note ? { message: 'Note found', note } : { message: 'Note not found' };
}

function removeNote(title) {
  const cleanTitle = normalizeTitle(title);
  if (!cleanTitle) return { message: 'A non-empty title is required.' };

  const savedNotes = loadNotes();
  const remainingNotes = _.reject(savedNotes, (note) => note.title.toLowerCase() === cleanTitle.toLowerCase());
  if (remainingNotes.length === savedNotes.length) return { message: 'Note not found' };

  saveNotes(remainingNotes);
  return { message: 'Note removed' };
}

module.exports = { addNote, listNotes, readNote, removeNote };