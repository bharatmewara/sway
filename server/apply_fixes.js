const fs = require('fs');
const path = require('path');

const replaceInFile = (file, replacements) => {
  const filepath = path.join(__dirname, 'routes', file);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filepath, content);
  console.log(`Updated ${file}`);
};

// 1. requests.js
replaceInFile('requests.js', [
  { search: /AGE\(u\.dob\)/g, replace: "AGE(u.date_of_birth)" },
  { search: /is_deleted = false/g, replace: "is_active = true" },
]);

// 2. crushes.js
replaceInFile('crushes.js', [
  { search: /AGE\(u\.dob\)/g, replace: "AGE(u.date_of_birth)" },
  { search: /is_deleted = false/g, replace: "is_active = true" },
]);

// 3. visitors.js
replaceInFile('visitors.js', [
  { search: /AGE\(u\.dob\)/g, replace: "AGE(u.date_of_birth)" },
  { search: /is_deleted = false/g, replace: "is_active = true" },
]);

// 4. users.js
replaceInFile('users.js', [
  { search: /AGE\(u\.dob\)/g, replace: "AGE(u.date_of_birth)" },
  { search: /u\.dob/g, replace: "u.date_of_birth as dob" },
  { search: /LEFT JOIN profiles p ON p\.user_id = u\.id\s+WHERE/g, replace: "WHERE" },
  { search: /JOIN profiles p ON p\.user_id = u\.id\s+WHERE/g, replace: "WHERE" },
  { search: /p\.bio/g, replace: "u.bio" },
  { search: /p\.marital_status/g, replace: "u.marital_status" },
  { search: /p\.height/g, replace: "u.height" },
  { search: /p\.body_type/g, replace: "u.body_type" },
  { search: /p\.education/g, replace: "u.education" },
  { search: /p\.profession/g, replace: "u.profession" },
  { search: /p\.looking_for/g, replace: "u.looking_for" },
  { search: /p\.interests/g, replace: "u.interests" },
  { search: /p\.preferred_age_min/g, replace: "u.preferred_age_min" },
  { search: /p\.preferred_age_max/g, replace: "u.preferred_age_max" },
  { search: /is_deleted = false/g, replace: "is_active = true" },
]);

// 5. messages.js
replaceInFile('messages.js', [
  // SELECT queries
  { search: /AND m2\.is_deleted = false/g, replace: "" },
  { search: /AND c\.is_deleted = false/g, replace: "" },
  { search: /AND is_deleted = false/g, replace: "" },
  { search: /AND m\.is_deleted = false/g, replace: "" },
  // users table checks
  { search: /is_deleted = false AND is_banned = false/g, replace: "is_active = true AND is_banned = false" },
  // INSERT queries
  { search: /created_at, is_deleted\)/g, replace: "created_at)" },
  { search: /\$3, false\)/g, replace: "$3)" },
  { search: /is_read, is_deleted, created_at/g, replace: "is_read, created_at" },
  { search: /\$5, false, NOW\(\)/g, replace: "$5, NOW()" },
  // UPDATE / DELETE queries
  { search: /UPDATE messages SET is_deleted = true WHERE conversation_id = \$1/g, replace: "DELETE FROM messages WHERE conversation_id = $1" },
  { search: /UPDATE conversations SET is_deleted = true, updated_at = NOW\(\) WHERE id = \$1/g, replace: "DELETE FROM conversations WHERE id = $1" },
]);

// 6. private-photos.js
replaceInFile('private-photos.js', [
  { search: /is_deleted, created_at/g, replace: "created_at" },
  { search: /is_deleted = false AND is_banned = false/g, replace: "is_active = true AND is_banned = false" },
  { search: /AND is_deleted = false/g, replace: "" },
  { search: /\$3, false, NOW\(\)/g, replace: "$3, NOW()" },
  { search: /UPDATE private_photos SET is_deleted = true\s+WHERE id = \$1 AND user_id = \$2 AND is_deleted = false/g, replace: "DELETE FROM private_photos WHERE id = $1 AND user_id = $2" },
]);

console.log("All fixes applied!");
