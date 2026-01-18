import ky from 'ky';

const prefixUrl = `http://localhost:5001/`;

export const instance = ky.extend({
  headers: {
    Accept: 'application/json',
  },
  prefixUrl,
});
