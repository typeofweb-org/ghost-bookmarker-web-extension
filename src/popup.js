import * as Sentry from "@sentry/browser";
import { createPostUrl } from "./lib/create-post-url";
import "./style.css";

const form = document.getElementById("addLinkForm");
const options = document.querySelectorAll('[data-id="options"]');
const linkInput = document.getElementById("url");
const submitButton = document.getElementById("submitButton");
const errorList = document.getElementById("errorList");
const successNotification = document.getElementById("success");
const errorNotification = document.getElementById("error");

let link;

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
				tags: { section: "popup", app: "bookmarker" },
			},
		});
	});
}

/**
 * Asynchronously sets the URL of the currently active tab in the current window to a global variable (link)
 * and updates the value of a global input element (linkInput) with the same URL.
 * @async
 * @function
 * @returns {Promise<void>}
 */
async function setUrl() {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	const tab = tabs[0];
	link = tab.url;
	linkInput.value = link;
}

setUrl();

/**
 * Handles form submission event.
 * @param {Event} event - The submit event triggered by the form.
 */
form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const note = document.getElementById("note").value;
	link = document.getElementById("url").value;

	document.body.classList.add("loading");
	submitButton.disabled = true;

	// Ensure the API URL and API key are set
	chrome.storage.sync.get(["apiUrl", "apiKey"], (result) => {
		if (!result.apiUrl || !result.apiKey) {
			document.body.classList.remove("loading");
			errorList.innerHTML = `<p>Please set your Ghost API URL and API key in the extension options.</p>`;
			errorNotification.classList.remove("hidden");
			return;
		}

		// Send a message to the background script to create the post
		chrome.runtime.sendMessage({
			type: "updateOrCreatePost",
			link,
			note,
			apiUrl: result.apiUrl,
			apiKey: result.apiKey,
		});
	});
});

options.forEach((button) => {
	button.addEventListener("click", () => {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		}
	});
});

chrome.runtime.onMessage.addListener((message) => {
	document.body.classList.remove("loading");
	submitButton.disabled = false;

	if (message.type === "error") {
		if (message.text !== "default") {
			errorList.innerHTML = `<p>${message.text}</p>`;
		} else {
			errorList.innerHTML = `<p>Unknown error occurred. Please try again.</p>`;
		}

		errorNotification.classList.remove("hidden");
	}

	if (message.type === "success") {
		chrome.storage.sync.get(["apiUrl"], (result) => {
			createPostUrl(result.apiUrl, message.uuid);
			const loadingButton = document.getElementById("loading");
			loadingButton.style.display = "none";
			successNotification.classList.remove("hidden");

			setTimeout(() => {
				window.close();
			}, 3000);
		});
	}
});
