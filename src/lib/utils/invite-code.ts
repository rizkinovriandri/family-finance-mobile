import * as Crypto from 'expo-crypto';

// Karakter ambigu (0/O, 1/I) dikecualikan supaya gampang dibaca & diketik ulang.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 8) {
  const bytes = Crypto.getRandomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
