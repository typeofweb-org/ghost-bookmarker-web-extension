import {KJUR} from 'jsrsasign';
import {sendMessageToPopup, getError} from './error-handling';

/**
 * createJWT - takes a JWT and creates a Ghost Admin API token
 * @param {string} apiKey
 * @returns {Promise<string>} token
 */
export async function createJWT(apiKey) {
    let token = null;
    const [id, secret] = apiKey.split(':');

    if (!id || !secret) {
        sendMessageToPopup({type: 'error', text: getError('INVALID_API_KEY')});
        return;
    }

    const header = {
        alg: 'HS256',
        kid: id,
        typ: 'JWT'
    };

    const issuedAt = KJUR.jws.IntDate.get('now');
    const expirationTime = issuedAt + 5 * 60;

    const payload = {
        iat: issuedAt, // Max 5 minutes after 'now'
        exp: expirationTime, // 'now' (max 5 minutes after 'exp')
        aud: '/admin/'
    };

    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);

    try {
        token = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, secret);
    } catch (e) {
        sendMessageToPopup({type: 'error', text: getError('INVALID_API_KEY')});
    }

    return token;
}
