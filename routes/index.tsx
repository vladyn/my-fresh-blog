import { Handlers } from "$fresh/server.ts";
// Importing two new std lib functions to help with parsing front matter and joining file paths.
import { extract } from "https://deno.land/std@0.160.0/encoding/front_matter.ts";
import { join } from "https://deno.land/std@0.74.0/path/mod.ts";

interface Post {
    slug: string;
    title: string;
    publishedAt: Date;
    content: string;
    snippet: string;
}

export const handler: Handlers<Post[]> = {
    async GET(_req, ctx) {
        const posts = await getPosts();
        return ctx.render(posts);
    },
};

// helper function
async function getPosts(): Promise<Post[]> {
    const files = Deno.readDir("./posts");
    const promises = [];
    for await (const file of files) {
        const slug = file.name.replace(".md", "");
        promises.push(getPost(slug));
    }
    const posts = await Promise.all(promises) as Post[];
    posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    return posts;
}

async function getPost(slug: string): Promise<Post | null> {
    const text = await Deno.readTextFile(join("./posts", `${slug}.md`));
    const { attrs, body } = extract(text);
    return {
        slug,
        title: attrs.title,
        publishedAt: new Date(attrs.published_at),
        content: body,
        snippet: attrs.snippet,
    };
}

import { PageProps } from "$fresh/server.ts";

export default function BlogIndexPage(props: PageProps<Post[]>) {
    const posts = props.data;
    return (
        <main class="max-w-screen-md px-4 pt-16 mx-auto">
            <h1 class="text-5xl font-bold">Blog</h1>
            <div class="mt-8">
                {posts.map((post) => <PostCard post={post} />)}
            </div>
        </main>
    );
}

function PostCard(props: { post: Post }) {
    const { post } = props;
    return (
        <div class="py-8 border(t gray-200)">
            <a class="sm:col-span-2" href={`/${post.slug}`}>
                <h3 class="text(3xl gray-900) font-bold">
                    {post.title}
                </h3>
                <time class="text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString("en-us", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </time>
                <div class="mt-4 text-gray-900">
                    {post.snippet}
                </div>
            </a>
        </div>
    );
}