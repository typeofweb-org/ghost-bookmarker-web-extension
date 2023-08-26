/**
    Adds a bookmark to Ghost via the context menu or keyboard shortcut.
    Retrieves the API URL and API key from Chrome storage sync,
    and creates or updates a post with the given link and selection text.
    On success, displays a notification with the saved link's hostname.
    On error, displays a notification with the error message.
    @function addBookmarkViaContextMenuOrKeyboard
    @param {Object} info - An object containing information about the link and any selected text.
    @param {string} info.pageUrl - The URL of the page to be bookmarked.
    @param {string} [info.selectionText] - The selected text on the page (optional).
    @exports addBookmarkViaContextMenuOrKeyboard
    */
export function addBookmarkViaContextMenuOrKeyboard(info, updateOrCreatePost) {
    chrome.storage.sync.get(['apiUrl', 'apiKey'], async (result) => {
        if (!result.apiUrl || !result.apiKey) {
            chrome.runtime.openOptionsPage();
            return;
        } else {
            const {apiUrl, apiKey} = result;
            const link = info.pageUrl;
            const formattedLink = new URL(link);
            try {
                const uuid = await updateOrCreatePost({link, note: info.selectionText || '', apiUrl, apiKey, isContextMenu: true});
                chrome.notifications.create(uuid, {
                    type: 'basic',
                    iconUrl: '/icons/logo-48.png',
                    title: 'Bookmark added to Ghost!',
                    message: `Link saved from ${formattedLink.hostname}`
                });
            } catch (error) {
                chrome.notifications.create('error', {
                    type: 'basic',
                    iconUrl: '/icons/logo-48.png',
                    title: 'Problem adding bookmark',
                    message: error.message
                });
            }
        }
    });
}
