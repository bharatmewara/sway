const fs = require('fs');
const files = [
  'src/admin/pages/CityAnalytics.jsx',
  'src/admin/pages/Reports.jsx',
  'src/admin/pages/Settings.jsx',
  'src/admin/pages/Transactions.jsx',
  'src/admin/pages/UserDetail.jsx',
  'src/admin/pages/Verifications.jsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import AdminLayout from '[^']+';\r?\n?/g, '');
    content = content.replace(/<AdminLayout>/g, '<div>');
    content = content.replace(/<\/AdminLayout>/g, '</div>');
    fs.writeFileSync(f, content);
  }
});
console.log('Fixed nested layouts');
