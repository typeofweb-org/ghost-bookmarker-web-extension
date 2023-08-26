/**
 * Attempts to fetch oEmbed data for a given link to prepare a bookmark card
 * @param {object} data
 * @param {string} data.link
 * @param {string} data.apiUrl
 * @param {string} data.token
 * @returns {Promise<object|null>}
 * Example response:
 * {
 *       "version": "1.0",
 *       "type": "bookmark",
 *       "url": "https://www.newyorker.com/magazine/2023/04/24/how-much-can-duolingo-teach-us",
 *       "metadata": {
 *           "url": "https://www.newyorker.com/magazine/2023/04/24/how-much-can-duolingo-teach-us",
 *           "title": "How Much Can Duolingo Teach Us?",
 *           "description": "The company’s founder, Luis von Ahn, believes that artificial intelligence is going to make computers better teachers than humans.",
 *           "author": "Condé Nast",
 *           "publisher": "The New Yorker",
 *           "thumbnail": "https://media.newyorker.com/photos/64386d66a22e87ce2f4d3637/16:9/w_1280,c_limit/230424_r42232.jpg",
 *           "icon": "https://www.newyorker.com/verso/static/the-new-yorker/assets/favicon.ico"
 *       }
 *   }
 */
export async function getOembedData({link, apiUrl, token}) {
    try {
        const url = `${apiUrl}/ghost/api/admin/oembed/`;
        const headers = {
            Authorization: `Ghost ${token}`,
            'Content-Type': 'application/json',
            Origin: 'null',
            'Accept-Version': 'v5.0'
        };

        const requestUrl = new URL(url);

        // use type and url as query parameters
        requestUrl.searchParams.append('type', 'bookmark');
        requestUrl.searchParams.append('url', link);
        const response = await fetch(requestUrl, {headers});
        const oembed = await response.json();

        return oembed;
    } catch (e) {
        // noop
        return null;
    }
}
