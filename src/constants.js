export const FLAG_CONSTRUCTED = 0b00100000;
export const FLAG_LONG = 0b10000000;

export const MASK_TAG_CLASS = 0b11000000;
export const MASK_TAG_ENCODING = 0b00100000;
export const MASK_TAG_TYPE = 0b00011111;
export const MASK_LENGTH = 0b01111111;

export const PATTERN_PEM = /-----BEGIN ([a-zA-Z0-9 ]+)-----\r?\n(([a-zA-Z0-9/+]{1,64}\r?\n)*([a-zA-Z0-9/+]+=*){1,64})\r?\n-----END ([a-zA-Z0-9 ]+)-----/; // eslint-disable-line max-len
