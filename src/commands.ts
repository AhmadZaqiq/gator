import { formatDuration, parseDuration, scrapeFeeds } from "./aggregator";
import { setUser, readConfig } from "./config.js";
import {
    createUser,
    getUserByName,
    getUsers,
    resetUsers
} from "./lib/db/queries/users.js";
import { createFeed, getFeeds, getFeedByUrl, createFeedFollow,
    deleteFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feeds.js";
import { fetchFeed } from "./rss.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";
import type { Feed, User } from "./schema.js";

export type CommandHandler = (
    cmdName: string,
    ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(
    registry: CommandsRegistry,
    cmdName: string,
    handler: CommandHandler
): void {
    registry[cmdName] = handler;
}

export async function runCommand(
    registry: CommandsRegistry,
    cmdName: string,
    ...args: string[]
): Promise<void> {
    const handler: CommandHandler | undefined = registry[cmdName];

    if (handler === undefined) {
        throw new Error(`Unknown command: ${cmdName}`);
    }

    await handler(cmdName, ...args);
}

export async function handlerLogin(
    cmdName: string,
    ...args: string[]
): Promise<void> {
    if (args.length === 0) {
        throw new Error("A username is required");
    }

    const user = await getUserByName(args[0]);

    if (user === undefined) {
        throw new Error(`User ${args[0]} does not exist`);
    }

    setUser(args[0]);

    console.log(`User has been set to ${args[0]}`);
}

export async function handlerRegister(
    cmdName: string,
    ...args: string[]
): Promise<void> {
    if (args.length === 0) {
        throw new Error("A username is required");
    }

    const existingUser = await getUserByName(args[0]);

    if (existingUser !== undefined) {
        throw new Error(`User ${args[0]} already exists`);
    }

    const user = await createUser(args[0]);

    setUser(args[0]);

    console.log(`User ${args[0]} was created`);
    console.log(user);
}

export async function handlerReset(
    cmdName: string,
    ...args: string[]
): Promise<void> {
    await resetUsers();

    console.log("Database reset successfully");
}

export async function handlerUsers(
    cmdName: string,
    ...args: string[]
): Promise<void> {
    const users = await getUsers();
    const config = readConfig();

    for (const user of users) {
        if (user.name === config.currentUserName) {
            console.log(`* ${user.name} (current)`);
        } else {
            console.log(`* ${user.name}`);
        }
    }
}

function handleError(error: unknown): void {
    console.error(error);
}

export async function handlerAgg(
    cmdName: string,
    ...args: string[]
): Promise<void> {
    if (args.length !== 1) {
        throw new Error("usage: agg <time_between_reqs>");
    }

    const timeBetweenRequests: number = parseDuration(args[0]);

    console.log(
        `Collecting feeds every ${formatDuration(timeBetweenRequests)}`
    );

    await scrapeFeeds().catch(handleError);

    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, timeBetweenRequests);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

function printFeed(feed: Feed, user: User): void {
    console.log(`* ${feed.name}`);
    console.log(`  URL: ${feed.url}`);
    console.log(`  User: ${user.name}`);
}

export async function handlerAddFeed(
    cmdName: string,
    user: User,
    ...args: string[]
): Promise<void> {
    if (args.length < 2) {
        throw new Error("Usage: addfeed <name> <url>");
    }

    const feed = await createFeed(args[0], args[1], user.id);

    const feedFollow = await createFeedFollow(user.id, feed.id);

    console.log(`User ${feedFollow?.userName} is now following ${feedFollow?.feedName}`);

    printFeed(feed, user);
}


export async function handlerFeeds(
    cmdName: string,
    ...args: string[]
): Promise<void> {
    const feeds = await getFeeds();

    for (const result of feeds) {
        console.log(`* ${result.feed.name}`);
        console.log(`  URL: ${result.feed.url}`);
        console.log(`  User: ${result.user.name}`);
    }
}

export async function handlerFollow(
    cmdName: string,
    user: User,
    ...args: string[]
): Promise<void> {
    if (args.length === 0) {
        throw new Error("A feed URL is required");
    }

    const feed = await getFeedByUrl(args[0]);

    if (feed === undefined) {
        throw new Error(`Feed ${args[0]} does not exist`);
    }

    const feedFollow = await createFeedFollow(user.id, feed.id);

    console.log(`User ${feedFollow?.userName} is now following ${feedFollow?.feedName}`);
}

export async function handlerUnfollow(
    cmdName: string,
    user: User,
    ...args: string[]
): Promise<void> {
    if (args.length !== 1) {
        throw new Error("usage: unfollow <url>");
    }

    const feedUrl: string = args[0];

    await deleteFeedFollow(user.id, feedUrl);
}

export async function handlerFollowing(
    cmdName: string,
    user: User,
    ...args: string[]
): Promise<void> {
    const feedFollows = await getFeedFollowsForUser(user.id);

    for (const feedFollow of feedFollows) {
        console.log(`* ${feedFollow.feedName}`);
    }
}

export type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
) => Promise<void>;

export function middlewareLoggedIn(
    handler: UserCommandHandler
): CommandHandler {
    return async (
        cmdName: string,
        ...args: string[]
    ): Promise<void> => {
        const config = readConfig();

        if (config.currentUserName === undefined) {
            throw new Error("No user is currently logged in");
        }

        const user = await getUserByName(config.currentUserName);

        if (user === undefined) {
            throw new Error(`User ${config.currentUserName} does not exist`);
        }

        await handler(cmdName, user, ...args);
    };
}


export async function handlerBrowse(
    cmdName: string,
    user: User,
    ...args: string[]
): Promise<void> {
    let limit: number = 2;

    if (args.length > 1) {
        throw new Error("usage: browse [limit]");
    }

    if (args.length === 1) {
        limit = Number(args[0]);

        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error("limit must be a positive integer");
        }
    }

    const posts = await getPostsForUser(user.id, limit);

    for (const result of posts) {
        const post = result.post;

        console.log(`* ${post.title}`);
        console.log(`  URL: ${post.url}`);

        if (post.description !== null) {
            console.log(`  Description: ${post.description}`);
        }

        if (post.publishedAt !== null) {
            console.log(`  Published: ${post.publishedAt.toISOString()}`);
        }

        console.log();
    }
}
