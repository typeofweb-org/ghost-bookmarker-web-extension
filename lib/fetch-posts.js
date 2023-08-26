import {getAdminUrl, getHeaders} from './request-utils';
import {getError} from './error-handling';

/**
 *
 * @param {object} data
 * @param {string} data.apiUrl
 * @param {string} data.token
 * @returns {Promise<object[]>}
 */
export async function fetchPosts({apiUrl, token}) {
    const url = getAdminUrl(apiUrl);

    const headers = getHeaders(token);

    // Fetch post with title 'Bookmarked links'
    const getPostsRequestUrl = new URL(url);
    getPostsRequestUrl.searchParams.append('filter', `title:'Bookmarked links'+status:draft`);
    getPostsRequestUrl.searchParams.append('order', 'published_at asc');
    getPostsRequestUrl.searchParams.append('limit', '1');
    getPostsRequestUrl.searchParams.append('formats', 'lexical');

    const response = await fetch(getPostsRequestUrl, {headers});

    if (!response.ok) {
        const {errors} = await response.json();
        throw new Error(errors?.[0]?.message ?? 'Could\'t fetch posts.');
    }

    // Handle Ghost specific errors if site is offline or has other issues
    if (response?.url.match(/offline|sleep.ghost.org/igm)) {
        throw new Error(getError('SITE_OFFLINE'));
    } else if (response?.url.match(/maintenance.ghost.org/igm)) {
        throw new Error(getError('MAINTENANCE'));
    } else if (response?.url.match(/domain.ghost.org/igm)) {
        throw new Error(getError('DOMAIN_ERROR'));
    }

    const {posts} = await response.json();

    return posts;
}
