require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://dhanuprakashreddy:Alavala2003@cluster0.bedosvm.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true, required: true },
  name: String,
  email: { type: String, unique: true, required: true },
  phone: String,
  password: String,
});

const Admin = mongoose.model('Admin', adminSchema);


app.post('/api/admin/signup', async (req, res) => {
  const { adminId, name, email, phone, password } = req.body;
  try {
    
    const existingAdminId = await Admin.findOne({ adminId });
    if (existingAdminId) {
      return res.status(400).json({ message: 'This Admin ID is already taken. Please choose a different one.' });
    }
    
    
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ adminId, name, email, phone, password: hashedPassword });
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error.', detail: err.message });
  }
});


app.post('/api/admin/signin', async (req, res) => {
  const { adminId, password } = req.body;
  try {
    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    res.status(200).json({ message: 'Sign in successful.' });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: 'Server error.', detail: err.message });
  }
});


app.post('/api/admin/forgot-password', async (req, res) => {
  const { adminId, email } = req.body;
  if (!adminId || !email) {
    return res.status(400).json({ message: 'Admin ID and Email are required.' });
  }
  try {
    const admin = await Admin.findOne({ adminId, email });
    if (!admin) {
      return res.status(400).json({ message: 'No matching admin found.' });
    }

    
    const tempPassword = crypto.randomBytes(6).toString('hex'); 
    const hashed = await bcrypt.hash(tempPassword, 10);
    admin.password = hashed;
    await admin.save();

    
    let nodemailerPkg = null;
    try {
      nodemailerPkg = require('nodemailer');
    } catch (err) {
      nodemailerPkg = null;
    }

    let mailSent = false;
    if (nodemailerPkg && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailerPkg.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: admin.email,
          subject: 'Admin Password Reset',
          text: `Your temporary password is: ${tempPassword}\nPlease sign in and change your password immediately.`
        });
        mailSent = true;
      } catch (err) {
        console.error('Error sending forgot-password email:', err);
      }
    } else {
     
      console.log(`Temporary password for ${admin.email}: ${tempPassword}`);
    }

    if (mailSent) {
      return res.status(200).json({ message: 'A temporary password has been sent to your email address.' });
    }

    return res.status(200).json({ message: 'Temporary password generated.' });
  } catch (err) {
    console.error('Forgot-password error:', err);
    return res.status(500).json({ message: 'Server error.', detail: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
