# Gator

Gator is a command-line RSS feed aggregator built with TypeScript, Node.js, PostgreSQL, and Drizzle ORM.

It allows users to register and log in, add RSS feeds, follow and unfollow feeds, continuously collect posts, and browse the latest posts from followed feeds.

## Requirements

- Node.js 22+
- npm
- PostgreSQL
- Git

## Setup

Clone the repository:

    git clone <YOUR_REPOSITORY_URL>
    cd gator

Install dependencies:

    npm install

Create a PostgreSQL database named `gator`.

Create `~/.gatorconfig.json` with:

    {
      "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
    }

Run database migrations:

    npx drizzle-kit migrate

## Running Gator

Run commands with:

    npm run start <command>

### Register

    npm run start register <username>

### Login

    npm run start login <username>

### List users

    npm run start users

### Add a feed

    npm run start addfeed "<feed name>" "<feed URL>"

Example:

    npm run start addfeed "Hacker News RSS" "https://hnrss.org/newest"

### List feeds

    npm run start feeds

### Follow a feed

    npm run start follow <feed URL>

### Unfollow a feed

    npm run start unfollow <feed URL>

### List followed feeds

    npm run start following

### Aggregate posts

    npm run start agg 10s

Supported duration units:

- `ms` - milliseconds
- `s` - seconds
- `m` - minutes
- `h` - hours

Press `Ctrl+C` to stop the aggregator.

### Browse posts

    npm run start browse

The default limit is 2 posts.

To browse a custom number of posts:

    npm run start browse 10

### Reset database

    npm run start reset

## Development

Check TypeScript:

    npx tsc --noEmit

Generate a migration:

    npx drizzle-kit generate

Apply migrations:

    npx drizzle-kit migrate

## Tech Stack

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM
- fast-xml-parser
