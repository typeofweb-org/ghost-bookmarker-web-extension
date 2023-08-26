/**
 * Checks if the user has granted permission to the given API URL
 * @param {string} pattern
 * @returns {Promise<boolean>}
 */
export async function hasUrlPermission(pattern) {
    return new Promise((resolve, reject) => {
        chrome.permissions.contains(
            {
                permissions: [],
                origins: [pattern]
            },
            (result) => {
                if (chrome.runtime.lastError) {
                    // eslint-disable-next-line no-console
                    console.log(`Error checking permissions for ${pattern}: `, chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`Valid permissions found for ${pattern}`);
                    resolve(result);
                }
            }
        );
    });
}

/**
 *
 * @param {string} pattern
 * @returns {Promise<void>}
 */
export async function removeUrlPermission(pattern) {
    // Remove permissions
    chrome.permissions.remove({
        permissions: [],
        origins: [pattern]
    }, (removed) => {
        if (removed) {
            // eslint-disable-next-line no-console
            console.log(`Permissions removed for ${pattern}.`);
        } else {
            // eslint-disable-next-line no-console
            console.log(`Failed to remove permissions for ${pattern}.`);
        }
    });
}
