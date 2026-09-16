const fs = require('fs');
const files = [
  'src/admin/pages/Dashboard.jsx',
  'src/admin/pages/Users.jsx',
  'src/admin/pages/Verifications.jsx',
  'src/admin/pages/Transactions.jsx',
  'src/admin/pages/Reports.jsx',
  'src/admin/pages/CityAnalytics.jsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // In Dashboard.jsx
    if (f.includes('Dashboard')) {
      content = content.replace(/catch \(\w+\) \{[\s\S]*?setData\(MOCK\);[\s\S]*?\}/, 'catch (err) {\n      console.error(err);\n    } finally {');
      content = content.replace(/const d = data \|\| MOCK;/, 'const d = data || {};');
      content = content.replace(/const stats = d\.stats \|\| MOCK\.stats;/, 'const stats = d.stats || {};');
      content = content.replace(/const revenueData = d\.revenueData \|\| MOCK\.revenueData;/, 'const revenueData = d.revenueData || [];');
      content = content.replace(/const genderData = d\.genderData \|\| MOCK\.genderData;/, 'const genderData = d.genderData || [];');
      content = content.replace(/const messagesData = d\.messagesData \|\| MOCK\.messagesData;/, 'const messagesData = d.messagesData || [];');
      content = content.replace(/const cityWiseUsers = d\.cityWiseUsers \|\| MOCK\.cityWiseUsers;/, 'const cityWiseUsers = d.cityWiseUsers || [];');
      content = content.replace(/const recentUsers = d\.recentUsers \|\| MOCK\.recentUsers;/, 'const recentUsers = d.recentUsers || [];');
    }

    // In Users.jsx
    if (f.includes('Users')) {
      content = content.replace(/catch \(\w+\) \{[\s\S]*?fallback mock[\s\S]*?setUsers\(filtered[^;]+;\n    \}/, "catch (err) {\n      console.error(err);\n      setUsers([]);\n      setTotal(0);\n    }");
      content = content.replace(/toast\.success\(`[^`]+ \(mock\)`\);[^}]+\}/g, "toast.error('Action failed');\n    }");
    }

    // In Verifications.jsx
    if (f.includes('Verifications')) {
      content = content.replace(/catch \(\w+\) \{[\s\S]*?fallback mock[\s\S]*?setRequests\(filtered[^;]+;\n    \}/, "catch (err) {\n      console.error(err);\n      setRequests([]);\n      setTotal(0);\n    }");
      content = content.replace(/toast\.success\(`[^`]+ \(mock\)`\);[^}]+\}/g, "toast.error('Action failed');\n    }");
    }

    // In Transactions.jsx
    if (f.includes('Transactions')) {
      content = content.replace(/catch \(\w+\) \{[\s\S]*?fallback mock[\s\S]*?setTransactions\(filtered[^;]+;\n    \}/, "catch (err) {\n      console.error(err);\n      setTransactions([]);\n      setTotal(0);\n    }");
    }

    // In Reports.jsx
    if (f.includes('Reports')) {
      content = content.replace(/catch \(\w+\) \{[\s\S]*?fallback mock[\s\S]*?setReports\(filtered[^;]+;\n    \}/, "catch (err) {\n      console.error(err);\n      setReports([]);\n      setTotal(0);\n    }");
      content = content.replace(/toast\.success\(`[^`]+ \(mock\)`\);[^}]+\}/g, "toast.error('Action failed');\n    }");
    }

    // In CityAnalytics.jsx
    if (f.includes('CityAnalytics')) {
      content = content.replace(/catch \(\w+\) \{[\s\S]*?fallback mock[\s\S]*?setCityData\(MOCK_DATA\);[\s\S]*?\}/, 'catch (err) {\n      console.error(err);\n      setCityData([]);\n    }');
    }

    fs.writeFileSync(f, content);
  }
});
console.log('Done stripping mocks');
