import {createNewPostContent} from './content-utils';
import {getFriendlyError} from './error-handling';
import {getAdminUrl, getHeaders} from './request-utils';

/**
 *
 * @param {object} data
 * @param {string} data.link
 * @param {string} data.note
 * @param {string} data.apiUrl
 * @param {string} data.token
 * @returns {Promise<string>} uuid
 */
export async function createPost({link, apiUrl, note, token}) {
    let postContent = null;
    const url = getAdminUrl(apiUrl);
    const headers = getHeaders(token);
    const requestUrl = new URL(url);

    postContent = await createNewPostContent({apiUrl, link, note, token});

    const newPost = {
        title: 'Bookmarked links',
        lexical: JSON.stringify(postContent),
        status: 'draft'
    };

    const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({posts: [newPost]})
    });

    if (!response.ok) {
        const {errors} = await response.json();
        const errorMsg = getFriendlyError(errors?.[0]?.message, 'Error trying to create a new post.');
        throw new Error(errorMsg);
    }

    const newPostRes = await response.json();
    const {uuid} = newPostRes.posts[0];

    return uuid;
}
