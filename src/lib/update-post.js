import { updatePostContent } from "./content-utils";
import { getFriendlyError, getError } from "./error-handling";
import { getAdminUrl, getHeaders } from "./request-utils";

/**
 *
 * @param {object} post
 * @param {string} post.id
 * @param {string} post.lexical
 * @param {object} data
 * @param {string} data.link
 * @param {string} data.note
 * @param {string} data.apiUrl
 * @param {string} data.token
 * @returns {Promise<string>} uuid
 */
export async function updatePost(post, { link, apiUrl, note, token }) {
  let postContent = null;

  if (!post?.lexical) {
    throw new Error(getError("NO_LEXICAL"));
  }

  postContent = await updatePostContent({
    lexical: JSON.parse(post?.lexical),
    link,
    apiUrl,
    note,
    token,
  });
  const headers = getHeaders(token);
  const url = getAdminUrl(apiUrl);

  post.lexical = JSON.stringify(postContent);

  const requestUrl = new URL(`${url}${post?.id}`);

  const response = await fetch(requestUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ posts: [post] }),
  });

  if (!response.ok) {
    const { errors } = await response.json();
    const errorMsg = getFriendlyError(
      errors?.[0]?.message,
      "Error trying to update post.",
    );
    throw new Error(errorMsg);
  }

  const newPostRes = await response.json();
  const { uuid } = newPostRes.posts[0];

  return uuid;
}
