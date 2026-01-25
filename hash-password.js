const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password for admin123:');
  console.log(hashedPassword);
  console.log('\nUse this SQL to insert admin user:');
  console.log(`INSERT INTO users (email, password, name, role) VALUES ('admin@maduraipandiyan.com', '${hashedPassword}', 'Admin User', 'admin');`);
}

hashPassword();
