// generate_jwt_secret.js

import { randomBytes } from 'crypto';

const secret = randomBytes(64).toString('hex');
console.log(secret);
