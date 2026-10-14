const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\DELL\\Desktop\\Sanjai_Ram_Portfolio\\modular\\index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<h1')) {
    console.log(`Line ${i + 1}:`);
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 4); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
    console.log('-----------------------------------');
  }
});
