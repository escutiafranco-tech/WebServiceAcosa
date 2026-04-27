const { isValidUsername } = require('./Backend/utils/security');

console.log('isValidUsername("admin"):', isValidUsername('admin'));
console.log('isValidUsername("ad"):', isValidUsername('ad'));
console.log('isValidUsername("administrator"):', isValidUsername('administrator'));
