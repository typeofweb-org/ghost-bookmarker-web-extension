import * as Sentry from "@sentry/browser";
import { getFriendlyError, sendMessageToPopup, getError } from "./lib/error-handling";
import { createJWT } from "./lib/create-jwt";
import { fetchPosts } from "./lib/fetch-posts";
import { updatePost } from "./lib/update-post";
import { createPost } from "./lib/create-post";
import { hasUrlPermission } from "./lib/permission-utils";
import { createPostUrl } from "./lib/create-post-url";
import { addBookmarkViaContextMenuOrKeyboard } from "./lib/add-bookmark-via-menu-or-keyboard";

const environment = process.env.NODE_ENV ?? "production";
const release = process.env.npm_package_version ?? null;
const dsn = null;

// Sentry is blocked by some content blockers
if (typeof Sentry !== "undefined" && dsn) {
	Sentry.onLoad(function () {
		Sentry.init({
			dsn,
			environment,
			release,
			tracesSampleRate: environment === "production" ? 0.2 : 1.0,
			initialScope: {
				tags: { section: "background", app: "bookmarker" },
			},
		});
	});
}

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.storage.local.set({ firstInstall: true });
	}

	chrome.storage.sync.get(["apiUrl", "apiKey"], async (result) => {
		if (!result.apiUrl || !result.apiKey) {
			chrome.runtime.openOptionsPage();
			return;
		}
	});
});

chrome.runtime.onMessage.addListener((request) => {
	if (request.type === "updateOrCreatePost") {
		updateOrCreatePost(request);
	}
});

/**
 *
 * @param {object} data
 * @param {string} data.link
 * @param {string} data.note
 * @param {string} data.apiUrl
 * @param {string} data.apiKey
 * @returns {Promise<void>}
 */
async function updateOrCreatePost({ link, note, apiUrl, apiKey, isContextMenu = false }) {
	// Ensure we have the permission to do requests to the provided URL
	const hasPermission = await hasUrlPermission(`${apiUrl}/*`);

	if (!hasPermission) {
		const errorMsg = getError("NO_PERMISSION");
		if (isContextMenu) {
			throw Error(errorMsg);
		}

		return sendMessageToPopup({ type: "error", text: errorMsg });
	}

	const token = await createJWT(apiKey);

	if (!token) {
		const errorMsg = getError("INVALID_API_KEY");
		if (isContextMenu) {
			throw Error(errorMsg);
		}

		sendMessageToPopup({ type: "error", text: errorMsg });
		return;
	}

	try {
		const posts = await fetchPosts({ apiUrl, token });

		if (posts?.length === 0) {
			try {
				// If no post with this title exists yet, create one
				const uuid = await createPost({ link, apiUrl, note, token });

				if (isContextMenu) {
					return uuid;
				}

				sendMessageToPopup({
					type: "success",
					text: "Link added to your bookmarks",
					uuid,
				});
			} catch (error) {
				const errorMsg = getFriendlyError(error?.message, "Error trying to create a new post.");

				if (isContextMenu) {
					throw Error(errorMsg);
				}

				sendMessageToPopup({ type: "error", text: errorMsg || "default" });
				return;
			}
		} else {
			try {
				// Append the new link to the existing post
				const post = posts?.[0];

				const uuid = await updatePost(post, { link, apiUrl, note, token });

				if (isContextMenu) {
					return uuid;
				}

				sendMessageToPopup({
					type: "success",
					text: "Link added to your bookmarks",
					uuid,
				});
			} catch (error) {
				const errorMsg = getFriendlyError(error?.message, "Error trying to update post.");

				if (isContextMenu) {
					throw Error(errorMsg);
				}

				sendMessageToPopup({ type: "error", text: errorMsg || "default" });
			}
		}
	} catch (error) {
		Sentry.captureException(error);
		const errorMsg = getFriendlyError(error?.message, "Error trying to update or create post.");

		if (isContextMenu) {
			throw Error(errorMsg);
		}

		sendMessageToPopup({ type: "error", text: errorMsg || "default" });
	}
}

// Add bookmark via context menu
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "quickAddBookmark",
		title: "Add bookmark",
		contexts: ["all"],
	});
});

chrome.contextMenus.onClicked.addListener(async (info) => {
	if (info.menuItemId === "quickAddBookmark") {
		addBookmarkViaContextMenuOrKeyboard(info, updateOrCreatePost);
	}
});

chrome.notifications.onClicked.addListener((uuid) => {
	chrome.storage.sync.get("apiUrl", (result) => {
		const url = createPostUrl(result.apiUrl, uuid, true);
		chrome.tabs.create({ url });
	});
});

// Add bookmark via keyboard
chrome.commands.onCommand.addListener((command) => {
	if (command === "bookmark_command") {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const currentTab = tabs[0];
			const id = currentTab.id;

			function getSelectedText() {
				const selectionText = window.getSelection().toString();
				return selectionText || "";
			}

			chrome.scripting
				.executeScript({
					target: { tabId: id },
					func: getSelectedText,
				})
				.then((results) => {
					const selectionText = results[0].result;
					addBookmarkViaContextMenuOrKeyboard(
						{ pageUrl: currentTab.url, selectionText },
						updateOrCreatePost,
					);
				})
				.catch((error) => {
					Sentry.captureException(error);
					throw Error(error);
				});
		});
	}
});
