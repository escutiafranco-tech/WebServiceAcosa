const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

exports.getAllUsers = (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const safe = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
  res.json(safe);
};