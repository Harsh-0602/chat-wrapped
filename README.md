# Chat Wrapped MVP

A zero-backend WhatsApp chat analytics experience. Users export a WhatsApp chat
as a `.txt` file, and all parsing and analysis happens locally in the browser.

## Run

Open `index.html` directly, or serve the `outputs` directory with any static
file server.

## Supported exports

- Android and iPhone bracketed date formats
- 12-hour and 24-hour timestamps
- Multiline messages
- Group chats

The parser assumes day/month/year when both date components are 12 or lower,
which matches the common Indian WhatsApp export format.

## Privacy

No backend, analytics, account, or network upload is used for chat contents.
Google Fonts are loaded for presentation; self-host them before production if
you want the page itself to make no external requests.
