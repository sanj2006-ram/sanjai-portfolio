const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\DELL\\Desktop\\Sanjai_Ram_Portfolio\\modular\\index.html', 'utf8');
const regex = /href=["'](https?:\/\/[^"']+)["']/gi;
const links = new Set();
let match;
while ((match = regex.exec(html)) !== null) {
  links.add(match[1]);
}
console.log('External Links in portfolio:');
links.forEach(l => console.log(' - ' + l));
