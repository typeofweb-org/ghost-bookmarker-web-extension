/**
 * Checks if the user has granted permission to the given API URL
 * @param {string} pattern
 * @returns {Promise<boolean>}
 */
export async function hasUrlPermission(pattern) {
  return new Promise((resolve, reject) => {
    browser.permissions.contains(
      {
        permissions: [],
        origins: [pattern],
      },
      (result) => {
        if (browser.runtime.lastError) {
          // eslint-disable-next-line no-console
          console.log(
            `Error checking permissions for ${pattern}: `,
            browser.runtime.lastError,
          );
          reject(browser.runtime.lastError);
        } else {
          // eslint-disable-next-line no-console
          console.log(`Valid permissions found for ${pattern}`);
          resolve(result);
        }
      },
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
  browser.permissions.remove(
    {
      permissions: [],
      origins: [pattern],
    },
    (removed) => {
      if (removed) {
        // eslint-disable-next-line no-console
        console.log(`Permissions removed for ${pattern}.`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`Failed to remove permissions for ${pattern}.`);
      }
    },
  );
}
