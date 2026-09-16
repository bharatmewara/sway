const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/sway_dating'
});

const firstNamesMale = ["Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Atharv", "Rahul", "Rohan", "Vikram", "Siddharth", "Karan", "Kunal", "Ravi", "Amit", "Sumit", "Raj", "Aryan", "Kabir", "Ansh", "Dhruv", "Rudra", "Ayush", "Om", "Jai", "Yash", "Dev"];
const firstNamesFemale = ["Saanvi", "Aanya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Navya", "Manya", "Aliya", "Priya", "Neha", "Pooja", "Sneha", "Kriti", "Shruti", "Riya", "Nisha", "Swati", "Kavya", "Kiara", "Myra", "Prisha", "Riya", "Sara", "Zara", "Nisha", "Meera", "Tara", "Roshni"];
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Desai", "Joshi", "Mishra", "Pandey", "Chauhan", "Yadav", "Reddy", "Rao", "Nair", "Iyer", "Menon", "Pillai", "Das", "Bose", "Sen", "Roy", "Malhotra", "Mehra", "Kapoor", "Bhatia", "Chopra", "Sethi", "Trivedi", "Tiwari"];

const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  console.log('Seeding 100 demo users...');
  const passwordHash = await bcrypt.hash('Demo@123', 10);
  
  for (let i = 0; i < 100; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? getRandomItem(firstNamesMale) : getRandomItem(firstNamesFemale);
    const lastName = getRandomItem(lastNames);
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${getRandomInt(10, 999)}`;
    const email = `${username}@demo.com`;
    const gender = isMale ? 'male' : 'female';
    const age = getRandomInt(18, 45);
    const birthYear = new Date().getFullYear() - age;
    const dateOfBirth = `${birthYear}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`;
    const city = getRandomItem(cities);
    const state = "Demo State";
    const credits = getRandomInt(0, 500);
    const isOnline = Math.random() > 0.7;
    const isVerified = Math.random() > 0.5;
    const verStatus = isVerified ? 'verified' : (Math.random() > 0.5 ? 'pending' : 'rejected');
    
    // Some basic profile info
    const bio = `Hi, I am ${firstName}. Looking for meaningful connections.`;
    const height = getRandomInt(150, 190);
    const professions = ['Software Engineer', 'Doctor', 'Teacher', 'Designer', 'Entrepreneur', 'Manager', 'Student'];
    const profession = getRandomItem(professions);

    try {
      await pool.query(
        `INSERT INTO users (
          username, email, password_hash, gender, date_of_birth, age, 
          country, state, city, bio, height, profession,
          is_online, verification_status, connect_credits, role, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 
          'India', $7, $8, $9, $10, $11,
          $12, $13, $14, 'user', NOW() - (random() * interval '30 days'), NOW()
        )`,
        [username, email, passwordHash, gender, dateOfBirth, age, state, city, bio, height, profession, isOnline, verStatus, credits]
      );
    } catch (err) {
      if (!err.message.includes('duplicate key')) {
        console.error('Error inserting user', username, err.message);
      }
    }
  }
  
  console.log('Successfully seeded 100 demo users!');
  process.exit(0);
}

seed();
