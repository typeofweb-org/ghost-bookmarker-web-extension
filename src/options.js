import * as Sentry from "@sentry/browser";
import "./style.css";
import { showNotification, hideNotification } from "../lib/notifications";
import { removeUrlPermission, hasUrlPermission } from "../lib/permission-utils";
import { createJWT } from "../lib/create-jwt";
import { fetchPosts } from "../lib/fetch-posts";
import { getError } from "../lib/error-handling";

const environment = process.env.NODE_ENV ?? "production";
const release = process.env.npm_package_version ?? null;
const dsn = "__sentry_dsn__" || null;

// Sentry is blocked by some content blockers
if (typeof Sentry !== "undefined" && dsn) {
  Sentry.onLoad(function () {
    Sentry.init({
      dsn,
      integrations: [new Sentry.BrowserTracing()],
      environment,
      release,
      tracesSampleRate: environment === "production" ? 0.2 : 1.0,
      initialScope: {
        tags: { section: "options", app: "bookmarker" },
      },
    });
  });
}

// see if we have saved Options, if so, populate the form with the saved values
chrome.storage.sync.get(["apiUrl", "apiKey"], (result) => {
  if (result.apiKey) {
    document.getElementById("apiKey").value = result.apiKey;
  }

  if (result.apiUrl) {
    document.getElementById("apiUrl").value = result.apiUrl;
  }

  if (result.apiKey || result.apiUrl) {
    document.getElementById("submitButton").textContent = "Update";
  }
});

const testApiKey = async (apiUrl, apiKey) => {
  const token = await createJWT(apiKey);

  if (!token) {
    throw new Error(getError("INVALID_API_KEY"));
  }

  try {
    await fetchPosts({ apiUrl, token });
    return true;
  } catch (error) {
    throw new Error(getError("INVALID_API_KEY"));
  }
};

/**
 * Sets the request header for the specified API URL to
 * avoid CORS issues.
 * @param {string} apiUrl
 */
const addHeaderRules = async (apiUrl) => {
  // Grab the origin to avoid CORS/same-origin issues
  const { origin } = new URL(apiUrl);

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "origin", operation: "set", value: origin },
          ],
        },
        condition: {
          urlFilter: apiUrl,
          resourceTypes: ["xmlhttprequest"],
        },
      },
    ],
    removeRuleIds: [1],
  });
};

const sanitizeUrl = async () => {
  const apiInput = document.getElementById("apiUrl");
  let urlToTest = apiInput.value;

  if (!urlToTest || urlToTest === "" || urlToTest?.length < 5) {
    // don't validate until the URL is long enough
    return;
  }

  if (!/^https?:\/\//.test(urlToTest)) {
    // add protocol if it's missing
    urlToTest = `https://${urlToTest}`;
  }

  // Check if URL contains ghost.io. If so, remove anything after the domain. Remove trailing slashes for all URLs.
  urlToTest = urlToTest.replace(/\/$/, "");

  const pattern = `${urlToTest}/*`;

  const hasPermission = await hasUrlPermission(pattern);

  if (/ghost\.io/.test(urlToTest) || hasPermission) {
    hideNotification("permission");
  } else {
    showNotification("permission");
  }

  // remove everything after `/ghost...`
  const match = urlToTest.match(/^(https?:\/\/[^/]+(?:\/[^/]+)*?)\/ghost.*$/);
  urlToTest = match?.[1] ?? urlToTest;

  // Replace the sanitizes value with the new value in the input field
  document.getElementById("apiUrl").value = urlToTest;

  return urlToTest;
};

/**
 * Verifies if the specified URL is a Ghost URL and
 * returns the correct Admin API URL.
 * @returns {object}
 */
const validateApiUrl = async (urlToTest) => {
  const formError = document.getElementById("form-error");
  formError.classList.add("invisible");

  let validatedUrl = null;
  // first, get a clean URL we can work with
  urlToTest = await sanitizeUrl(urlToTest);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    Origin: null,
  };

  const requestUrl = `${urlToTest}/ghost/api/admin/site/`;
  const pattern = `${urlToTest}/*`;

  try {
    const hasPermission = await hasUrlPermission(pattern);

    if (!hasPermission) {
      await requestUrlPermission(pattern);
    }

    const response = await fetch(requestUrl, {
      headers,
      method: "GET",
    });

    if (!response.ok) {
      await removeUrlPermission(pattern);

      return { error: response.statusText };
    } else {
      // Handle Ghost specific errors
      if (response?.url.match(/offline|sleep.ghost.org/gim)) {
        throw new Error(getError("SITE_OFFLINE"));
      } else if (response?.url.match(/maintenance.ghost.org/gim)) {
        throw new Error(getError("MAINTENANCE"));
      } else if (response?.url.match(/domain.ghost.org/gim)) {
        throw new Error(getError("DOMAIN_ERROR"));
      }

      if (response.url !== requestUrl) {
        validatedUrl = response.url.split("/ghost/api/admin/site")[0];
        // remove the previously granted permission for the wrong URL
        await removeUrlPermission(pattern);
        // request permission for the new URL
        await requestUrlPermission(`${validatedUrl}/*`);

        const hasUpdatedUrlPermission = await hasUrlPermission(
          `${validatedUrl}/*`
        );

        if (/ghost\.io/.test(validatedUrl) || hasUpdatedUrlPermission) {
          hideNotification("permission");
        } else {
          showNotification("permission");
        }

        document.getElementById("apiUrl").value = validatedUrl;
      } else {
        validatedUrl = urlToTest;
      }
    }

    return { url: validatedUrl };
  } catch (error) {
    if (error?.message.match(/failed to fetch/gim)) {
      return { error: getError("FAILED_REQUEST") };
    }
    Sentry.captureException(error);
    return { error };
  }
};

// Save the options, request permissions if needed, and animate notification message
const saveOptions = async (e) => {
  e.preventDefault();

  const formError = document.getElementById("form-error");
  formError.classList.add("invisible");

  const submitButton = document.getElementById("submitButton");
  document.body.classList.add("loading");
  submitButton.disabled = true;

  const apiInput = document.getElementById("apiUrl");
  let apiUrl = apiInput.value;
  const apiKey = document.getElementById("apiKey").value;

  try {
    const testResult = await validateApiUrl(apiUrl);

    if (testResult?.error) {
      throw new Error(testResult.error?.message ?? testResult.error);
    } else if (testResult?.url) {
      // set apiUrl to the sanitized and validated URL
      apiUrl = testResult.url;
      submitButton.textContent = "Update";
      submitButton.disabled = false;
    } else {
      throw new Error(getError("NOT_GHOST"));
    }

    const pattern = `${apiUrl}/*`;

    const hasPermission = await hasUrlPermission(pattern);

    if (!hasPermission) {
      await requestUrlPermission(pattern);
    }

    // Check the API key works for this site, before the user can continue
    await testApiKey(apiUrl, apiKey);

    chrome.storage.sync.set({ apiUrl, apiKey }, () => {
      hideNotification("permission");
      showNotification("success");
    });

    await addHeaderRules(apiUrl);

    // Update the input text
    apiInput.value = apiUrl;

    document.body.classList.remove("loading");
    submitButton.disabled = false;
  } catch (error) {
    formError.innerHTML = error?.message ?? getError("NOT_GHOST");
    formError.classList.remove("invisible");
    document.body.classList.remove("loading");
    submitButton.disabled = false;
    Sentry.captureException(error);
    return;
  }
};

document
  .getElementById("apiCredentials")
  .addEventListener("submit", saveOptions);
document.getElementById("apiUrl").addEventListener("blur", sanitizeUrl);

document.getElementById("apiUrl").addEventListener("focus", () => {
  document.getElementById("form-error").classList.add("invisible");
});

document.getElementById("apiKey").addEventListener("focus", () => {
  document.getElementById("form-error").classList.add("invisible");
});

/**
 * Requests URL permission for the specified URL pattern using the Chrome Permissions API.
 * @function
 * @param {string} urlPattern - The URL pattern for which permission is being requested.
 * @returns {Promise<void>} - A Promise that resolves if the permission is granted, and rejects with an error if not.
 */
function requestUrlPermission(urlPattern) {
  return new Promise((resolve, reject) => {
    chrome.permissions.request(
      {
        permissions: [],
        origins: [urlPattern],
      },
      (granted) => {
        if (granted) {
          resolve();
        } else {
          reject(new Error(getError("NO_PERMISSION")));
        }
      }
    );
  });
}

// Toggle the visibility of the staff token
const viewPasswordButton = document.getElementById("viewPassword");

viewPasswordButton.addEventListener("click", () => {
  const input = document.getElementById("apiKey");

  const inputType = input.getAttribute("type");

  if (inputType === "password") {
    input.setAttribute("type", "text");
  } else {
    input.setAttribute("type", "password");
  }
});

// Toggle the visibility of the info buttons
const infoButtons = document.querySelectorAll('[data-id="toggleInfo"]');

infoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextDiv = button.nextElementSibling;
    nextDiv.classList.toggle("hidden");
  });
});

// Show welcome notification on install
chrome.storage.local.get("firstInstall", (data) => {
  if (data.firstInstall) {
    showNotification("welcome");

    // Clear the firstInstall flag
    chrome.storage.local.set({ firstInstall: false });
  }
});

function generateRandomLogo() {
  const logo = document.getElementById("ghost-logo");
  const random = Math.floor(Math.random() * 10) + 1;
  const randomString = random > 9 ? random : "0" + random;
  const logoString = "/icons/ghost-logo-black-" + randomString + ".png";

  logo.setAttribute("src", logoString);
}

generateRandomLogo();
