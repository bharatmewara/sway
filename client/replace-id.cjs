const fs = require('fs');
const files = [
  'src/admin/pages/Dashboard.jsx',
  'src/admin/pages/Users.jsx',
  'src/admin/pages/UserDetail.jsx',
  'src/admin/pages/Verifications.jsx',
  'src/admin/pages/Transactions.jsx',
  'src/admin/pages/Reports.jsx',
  'src/admin/pages/CityAnalytics.jsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\._id\b/g, '.id');
    fs.writeFileSync(f, content);
  }
});
console.log('Done replacing _id with id');
