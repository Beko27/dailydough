const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));

// Update image URLs for remaining products
const imageMap = {
  1: '/uploads/ChocoChip.png',
  2: '/uploads/Biscoff.png',
  6: '/uploads/darkchoco.png',
  7: '/uploads/CoffeeCrumble.png',
  9: '/uploads/whitechocolatematcha.png',
  10: '/uploads/CookieMonster.png'
};

db.products.forEach(p => {
  if (imageMap[p.id]) {
    p.image_url = imageMap[p.id];
  }
});

fs.writeFileSync('data/db.json', JSON.stringify(db, null, 2));
console.log('Updated all product images');
