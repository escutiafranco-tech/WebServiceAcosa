const fs = require('fs');
const jwt = require('jsonwebtoken');
const usersFile = './data/system/users.json';

exports.login = (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ message: 'Usuario o contraseña incorrecto' });

  const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token });
};
