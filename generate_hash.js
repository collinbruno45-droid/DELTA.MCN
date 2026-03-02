// Usage: node generate_hash.js your-password
const bcrypt = require('bcryptjs');
const input = process.argv[2] || process.env.PASS || '';
if(!input){
  console.error('Pass the password as argument: node generate_hash.js mypass');
  process.exit(1);
}
const hash = bcrypt.hashSync(input, 10);
console.log(hash);
