import { and, eq, sql } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../../../schema.js";

export async function createFeed(
    name: string,
    url: string,
    userId: string
) {
    const [result] = await db
        .insert(feeds)
        .values({
            name: name,
            url: url,
            userId: userId
        })
        .returning();

    return result;
}

export async function getFeeds() {
    return await db
        .select({
            feed: feeds,
            user: {
                name: users.name
            }
        })
        .from(feeds)
        .innerJoin(users, eq(feeds.userId, users.id));
}

export async function getFeedByUrl(url: string) {
    const [result] = await db
        .select()
        .from(feeds)
        .where(eq(feeds.url, url));

    return result;
}

export async function createFeedFollow(
    userId: string,
    feedId: string
) {
    const [newFeedFollow] = await db
        .insert(feedFollows)
        .values({
            userId: userId,
            feedId: feedId
        })
        .returning();

    const [result] = await db
        .select({
            feedFollow: feedFollows,
            feedName: feeds.name,
            userName: users.name
        })
        .from(feedFollows)
        .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
        .innerJoin(users, eq(feedFollows.userId, users.id))
        .where(eq(feedFollows.id, newFeedFollow.id));

    return result;
}

export async function deleteFeedFollow(
    userId: string,
    feedUrl: string
): Promise<void> {
    const feed = await getFeedByUrl(feedUrl);

    if (feed === undefined) {
        throw new Error(`Feed ${feedUrl} does not exist`);
    }

    await db
        .delete(feedFollows)
        .where(
            and(
                eq(feedFollows.userId, userId),
                eq(feedFollows.feedId, feed.id)
            )
        );
}

export async function getFeedFollowsForUser(userId: string) {
    return await db
        .select({
            feedFollow: feedFollows,
            feedName: feeds.name,
            userName: users.name
        })
        .from(feedFollows)
        .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
        .innerJoin(users, eq(feedFollows.userId, users.id))
        .where(eq(feedFollows.userId, userId));
}


export async function markFeedFetched(feedId: string): Promise<void> {
    await db
        .update(feeds)
        .set({
            lastFetchedAt: new Date(),
            updatedAt: new Date()
        })
        .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
    const [feed] = await db
        .select()
        .from(feeds)
        .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
        .limit(1);

    return feed;
}
