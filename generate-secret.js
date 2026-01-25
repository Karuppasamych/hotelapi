const crypto = require('crypto');

// Generate a secure random secret key
const secret = crypto.randomBytes(64).toString('hex');

console.log('Generated JWT Secret Key:');
console.log(secret);
console.log('\nAdd this to your .env file:');
console.log(`JWT_SECRET=${secret}`);
