/**
 *
 * @param {string} apiUrl
 * @returns {string}
 */
export const getAdminUrl = apiUrl => `${apiUrl}/ghost/api/admin/posts/`;

/**
 *
 * @param {string} token
 * @returns {object}
 */
export const getHeaders = token => ({
    Authorization: `Ghost ${token}`,
    'Content-Type': 'application/json',
    Origin: 'null',
    'Accept-Version': 'v5.0'
});
