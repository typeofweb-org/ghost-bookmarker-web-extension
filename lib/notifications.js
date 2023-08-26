function enterCleanup(element) {
    element.classList.remove('ease-out', 'duration-300');
    element.classList.add('ease-in', 'duration-100');
    element.removeEventListener('transitionend', enterCleanup);
}

function exitCleanup(element) {
    element.classList.remove('ease-in', 'duration-100');
    element.classList.add('ease-out', 'duration-300');
    element.removeEventListener('transitionend', exitCleanup);
}

export function hideNotification(stringOrElement) {
    let el = stringOrElement;

    if (typeof stringOrElement === 'string') {
        el = document.getElementById(stringOrElement);
    }

    el.classList.add('hidden');
    el.addEventListener('transitionend', exitCleanup.bind(null, el));
    el.removeEventListener('click', hideNotification);
}
/**
 * Shows a notification element and optionally automatically closes it after a specified time.
 *
 * @module notifications
 * @function
 * @param {string} selector - The id attribute value of the notification element to display.
 * @param {boolean} [selfClose=false] - A flag indicating whether the notification should automatically close after 3 seconds.
 * @returns {void}
 * @example
 * // Display a notification with the ID 'my-notification' and automatically close it after 3 seconds
 * showNotification('my-notification', true);
 */
export function showNotification(selector, selfClose = false, timer = 3000) {
    const $notification = document.getElementById(selector);
    const $closeButton = $notification.querySelector('[data-id="close"]');

    $closeButton.addEventListener('click', hideNotification.bind(null, $notification));

    $notification.classList.remove('hidden');
    $notification.addEventListener('transitionend', enterCleanup.bind(null, $notification));

    if (selfClose) {
        setTimeout(hideNotification.bind(null, $notification), timer);
    }
}

