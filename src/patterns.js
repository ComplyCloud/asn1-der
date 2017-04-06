/* eslint-disable max-len */

export const PEM = /-----BEGIN ([a-zA-Z0-9 ]+)-----\n(([a-zA-Z0-9/+]{1,64}\n)*([a-zA-Z0-9/+]+=*){1,64})\n-----END ([a-zA-Z0-9 ]+)-----/;

export const results = {
  PEM: {
    body: 2,
  },
};

/* eslint-enable max-len */
