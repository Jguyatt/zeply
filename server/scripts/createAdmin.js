import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2];
    const password = process.argv[3] || 'admin123'; // Default password
    const name = process.argv[4] || 'Admin User';

    if (!email) {
      console.error('Please provide an email address');
      console.log('Usage: node createAdmin.js <email> [password] [name]');
      process.exit(1);
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      if (existingUser.role === 'admin') {
        console.log('User is already an admin.');
      } else {
        // Update to admin
        existingUser.role = 'admin';
        existingUser.password = password; // Will be hashed by pre-save hook
        await existingUser.save();
        console.log(`User ${email} has been upgraded to admin.`);
      }
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true
    });

    console.log(`Admin user created successfully!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Password: ${password} (please change this after first login)`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();

