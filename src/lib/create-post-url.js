// Error and success handling
export function createPostUrl(url, uuid, isContextMenu = false) {
	const editorUrl = `${url}/p/${uuid}/edit`;
	if (isContextMenu) {
		return editorUrl;
	}
	const postUrl = document.getElementById("postUrl");
	postUrl.textContent = "";
	const a = document.createElement("a");
	a.href = editorUrl;
	a.setAttribute("target", "_blank");
	a.textContent = "Bookmarked links";
	postUrl.appendChild(a);
}
