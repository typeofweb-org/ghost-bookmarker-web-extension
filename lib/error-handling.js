/**
 *
 * @param {string} message
 * @param {string} fallback
 * @returns {string}
 */
export const getFriendlyError = (message, fallback) => {
    if (!message) {
        if (fallback) {
            return fallback;
        }
        return null;
    }

    if (message.match(/Request made from incorrect origin/i)) {
        message = getError('CORS');
    } else if (message.match(/Invalid token|authorized/i)) {
        message = getError('INVALID_TOKEN');
    } else if (message.match(/Unknown Admin API Key/i)) {
        message = getError('INVALID_API_KEY');
    }

    return message;
};

export const getError = (error) => {
    const errors = {
        DEFAULT: 'An error occurred. Check your settings and try again.',
        INVALID_API_URL: 'Invalid URL. Ensure your Ghost URL is correct and try again.',
        NOT_GHOST: 'No Ghost site found. Ensure your URL is correct and try again.',
        INVALID_TOKEN: 'Incorrect token. Check your Ghost API key and try again.',
        INVALID_API_KEY: 'Invalid API key. Check your settings and try again.',
        CORS: 'Permission not granted. Confirm the list of allowed URLs in the extension settings.',
        NO_PERMISSION: 'Permission not granted. Submit your settings again to confirm permissions.',
        SITE_OFFLINE: 'Your Ghost site is currently offline. Contact support@ghost.org for help.',
        MAINTENANCE: 'Your Ghost site is currently in maintenance mode. Try again later.',
        DOMAIN_ERROR: 'Your custom domain is invalid. Contact support@ghost.org for help.',
        FAILED_REQUEST: 'Failed to fetch. Ensure your URL is correct and try again.',
        NO_LEXICAL: 'Unable to save. If you already have a draft post called "Bookmarked links", rename it and try again'
    };

    if (!error || !errors[error]) {
        return errors.DEFAULT;
    }

    return errors[error];
};

/**
 * Add error handling. This will send errors to the popup
 * @param {object} content
 * @param {string} content.type
 * @param {string} content.text
 * @param {string} content.uuid
 */
export function sendMessageToPopup(content) {
    const {type, text, uuid} = content;
    chrome.runtime.sendMessage({type, text, uuid});
}
