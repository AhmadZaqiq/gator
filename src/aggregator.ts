import {
    getNextFeedToFetch,
    markFeedFetched
} from "./lib/db/queries/feeds";
import { fetchFeed } from "./rss";
import { createPost } from "./lib/db/queries/posts";

export function parseDuration(durationStr: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);

    if (match === null) {
        throw new Error(
            "Invalid duration. Use a number followed by ms, s, m, or h"
        );
    }

    const value: number = Number(match[1]);
    const unit: string = match[2];

    switch (unit) {
        case "ms":
            return value;
        case "s":
            return value * 1000;
        case "m":
            return value * 60 * 1000;
        case "h":
            return value * 60 * 60 * 1000;
        default:
            throw new Error("Invalid duration unit");
    }
}

export function formatDuration(milliseconds: number): string {
    if (milliseconds >= 60 * 60 * 1000) {
        const hours: number = Math.floor(
            milliseconds / (60 * 60 * 1000)
        );

        const remaining: number =
            milliseconds % (60 * 60 * 1000);

        const minutes: number = Math.floor(
            remaining / (60 * 1000)
        );

        const seconds: number = Math.floor(
            (remaining % (60 * 1000)) / 1000
        );

        return `${hours}h${minutes}m${seconds}s`;
    }

    if (milliseconds >= 60 * 1000) {
        const minutes: number = Math.floor(
            milliseconds / (60 * 1000)
        );

        const seconds: number = Math.floor(
            (milliseconds % (60 * 1000)) / 1000
        );

        return `${minutes}m${seconds}s`;
    }

    if (milliseconds >= 1000) {
        const seconds: number = Math.floor(milliseconds / 1000);
        return `${seconds}s`;
    }

    return `${milliseconds}ms`;
}

export async function scrapeFeeds(): Promise<void> {
    const feed = await getNextFeedToFetch();

    if (feed === undefined) {
        console.log("No feeds to fetch");
        return;
    }

    console.log(`Fetching feed: ${feed.name}`);

    const rssFeed = await fetchFeed(feed.url);

    await markFeedFetched(feed.id);

    for (const item of rssFeed.channel.item) {
        const publishedAt: Date = new Date(item.pubDate);

        if (Number.isNaN(publishedAt.getTime())) {
            console.error(
                `Could not parse published date for post: ${item.title}`
            );
            continue;
        }

        await createPost(
            item.title,
            item.link,
            item.description,
            publishedAt,
            feed.id
        );
    }
}
