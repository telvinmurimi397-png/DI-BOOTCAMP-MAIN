# Notes App

A terminal-based Node.js app for adding, listing, reading, and removing notes stored in `notes.json`.

## Setup

```sh
npm install
```

## Commands

```sh
node app.js add --title="Note Title" --body="Note body"
node app.js list
node app.js read --title="Note Title"
node app.js remove --title="Note Title"
```

Titles are matched case-insensitively. Adding an existing title prints `Note already exists`; reading or removing a missing title prints `Note not found`.