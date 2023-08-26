import {
	getLexicalRoot,
	getLinkNode,
	getBookmarkNode,
	getNoteNode,
	getEmptyNode,
} from "./lexical-snippets";
import { getOembedData } from "./get-oembed-data";

/**
 *
 * @param {object} data
 * @param {object} data.lexical
 * @param {string} data.link
 * @param {string} data.apiUrl
 * @param {string} data.note
 * @param {string} data.token
 * @returns {Promise<object>}
 */
export async function updatePostContent({ lexical, link, apiUrl, note, token }) {
	let children = null;

	const oembed = await getOembedData({ link, apiUrl, token });

	if (oembed?.metadata) {
		children = getBookmarkNode(oembed.metadata);
	} else {
		children = getLinkNode(link);
	}

	lexical.root.children.push(getEmptyNode());

	// Add the links as either bookmark card or link
	lexical.root.children.push(children);

	if (note) {
		children = getNoteNode(note);
		// append the note as well
		lexical.root.children.push(children);
	}

	return lexical;
}

/**
 *
 * @param {object} data
 * @param {string} data.link
 * @param {string} data.apiUrl
 * @param {string} data.note
 * @param {string} data.token
 * @returns {Promise<object>}
 */
export async function createNewPostContent({ link, apiUrl, note, token }) {
	let children = null;

	const oembed = await getOembedData({ link, apiUrl, token });

	const postContent = getLexicalRoot();

	if (oembed?.metadata) {
		children = getBookmarkNode(oembed.metadata);
	} else {
		children = getLinkNode(link);
	}

	// Add the links as either bookmark-card or link
	postContent.root.children.push(children);

	if (note) {
		children = getNoteNode(note);
		// append the note as well
		postContent.root.children.push(children);
	}

	return postContent;
}
