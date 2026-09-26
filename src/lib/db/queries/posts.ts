import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, posts } from "../../../schema.js";

export async function createPost(
    title: string,
    url: string,
    description: string | null,
    publishedAt: Date | null,
    feedId: string
) {
    const [result] = await db
        .insert(posts)
        .values({
            title: title,
            url: url,
            description: description,
            publishedAt: publishedAt,
            feedId: feedId
        })
        .onConflictDoNothing({
            target: posts.url
        })
        .returning();

    return result;
}

export async function getPostsForUser(
    userId: string,
    limit: number
) {
    return await db
        .select({
            post: posts
        })
        .from(posts)
        .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
        .where(eq(feedFollows.userId, userId))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
}
