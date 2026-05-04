// controllers/authController.js
const { admin } = require('../config/firebase');
const { sql, poolPromise } = require('../config/db');
const {
  findUserByEmail,
  findUserByPhone,
  createUser,
  updateProfilePictures,
} = require('../models/authModel');
const walletModel = require('../models/walletModel');

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'firebase token required.' });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ error: 'invalid firebase token.' });
    }

    if (!decoded.email_verified) {
      return res.status(403).json({ 
        error: 'email not verified. please verify your email before completing registration.',
      });
    }

    const email = decoded.email;
    console.log('Registering user:', email);

    const { fullName, phone, city, area, cnic } = req.body;
    console.log('Profile data:', { fullName, phone, city, area, cnic });

    // Validation
    if (!fullName || !phone || !city || !cnic) {
      return res.status(400).json({ error: 'all required fields must be filled.' });
    }
    if (!/^03\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'phone must be 11 digits starting with 03.' });
    }
    if (!/^\d{13}$/.test(cnic)) {
      return res.status(400).json({ error: 'cnic must be exactly 13 digits.' });
    }

    const existingPhone = await findUserByPhone(phone);
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      console.log('User already exists, updating profile:', existingUser.UserID);
      
      // 1. UPDATE existing user with new profile data
      const pool = await poolPromise;
      await pool.request()
        .input('fullName', sql.NVarChar, fullName)
        .input('phone',  sql.NVarChar, phone)
        .input('city', sql.NVarChar, city)
        .input('area', sql.NVarChar, area || null)
        .input('cnic', sql.NVarChar, cnic)
        .input('email', sql.NVarChar, email)
        .query(`update Users 
        set FullName = @fullName, Phone = @phone, City = @city, Area = @area, CNIC = @cnic, IsVerified = 1 
        where Email = @email`);
      
      // 2. Save images if provided
      const profilePicUrl  = req.files?.profilePic?.[0]?.path  || existingUser.ProfilePic;
      const cnicPictureUrl = req.files?.cnicPicture?.[0]?.path || existingUser.CNICPicture;
      if (profilePicUrl || cnicPictureUrl) {
        await updateProfilePictures(email, profilePicUrl, cnicPictureUrl);
      }
      
      // ✅ SAFETY NET: Ensure existing user has a wallet with 5000 RS
      try {
        const wallet = await walletModel.getBalance(existingUser.UserID);
        if (!wallet) {
          console.log(`🔧 Safety Net: Creating wallet for existing user ${existingUser.UserID} with 5000 RS`);
          await walletModel.createWallet(existingUser.UserID, 5000);
        }
      } catch (err) {
        console.error('Wallet safety net error:', err);
      }

      return res.status(200).json({
        message: 'profile updated successfully.',
        user: {
          id:         existingUser.UserID,
          fullName:   fullName,
          email:      existingUser.Email,
          phone:      phone,
          city:       city,
          area:       area || null,
          role:       existingUser.Role || 'user',
          profilePic: profilePicUrl,
          isVerified: existingUser.IsVerified,
        },
      });
    }

    if (existingPhone && existingPhone.UserID) {
      return res.status(409).json({ error: 'phone number already registered.' });
    }

    // Create new user
    console.log('Creating new user...');
    const newUserId = await createUser({ fullName, email, phone, city, area, cnic, signupMethod: 'email' });
    console.log('New user ID:', newUserId);
    
    // ✅ Create wallet with 5000 RS
    await walletModel.createWallet(newUserId, 5000);
    console.log('Wallet created with 5000 RS for new user:', newUserId);

    // Save images
    const profilePicUrl  = req.files?.profilePic?.[0]?.path  || null;
    const cnicPictureUrl = req.files?.cnicPicture?.[0]?.path || null;
    if (profilePicUrl || cnicPictureUrl) {
      await updateProfilePictures(email, profilePicUrl, cnicPictureUrl);
    }

    res.status(201).json({
      message: 'profile saved successfully.',
      user: {
        id: newUserId,
        fullName: fullName,
        email: email,
        phone: phone,
        city: city,
        area: area || null,
        role: 'user',
        profilePic: profilePicUrl,
        isVerified: true,
      },
    });
  } catch (err) {
    console.error('❌ register error:', err.message);
    console.error(err);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'firebase token required.' });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ error: 'invalid or expired token.' });
    }

    if (!decoded.email_verified) {
      return res.status(403).json({
        error: 'please verify your email first.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const user = await findUserByEmail(decoded.email);
    console.log('Login attempt for:', decoded.email, 'User found:', !!user);

    if (!user) {
      return res.status(404).json({
        error: 'profile not found. please complete registration.',
        code: 'PROFILE_NOT_FOUND',
        requiresProfileCompletion: true,
      });
    }

    if (user.IsBanned) {
      return res.status(403).json({ error: 'your account has been suspended.' });
    }

    // ✅ SAFETY NET: Check wallet balance on login
    try {
      const wallet = await walletModel.getBalance(user.UserID);
      if (!wallet) {
        console.log(`🔧 Safety Net: Creating wallet for user ${user.UserID} with 5000 RS`);
        await walletModel.createWallet(user.UserID, 5000);
      } else if (parseFloat(wallet.Balance) <= 0) {
        // If wallet exists but is empty, fill it with 5000 RS so they can test
        console.log(`🔧 Safety Net: Topping up user ${user.UserID} wallet to 5000 RS`);
        await walletModel.addMoney(user.UserID, 5000);
      }
    } catch (err) {
      console.error('Wallet safety net error:', err);
    }

    res.json({
      message: 'login successful',
      user: {
        id:         user.UserID,
        fullName:   user.FullName,
        email:      user.Email,
        phone:      user.Phone,
        city:       user.City,
        area:       user.Area,
        role:       user.Role || 'user',
        profilePic: user.ProfilePic,
        isVerified: user.IsVerified,
      },
    });
  } catch (err) {
    console.error('❌ login error:', err.message);
    res.status(500).json({ error: 'something went wrong.' });
  }
};

// ─── GOOGLE AUTH ─────────────────────────────────────────────────────────────
const googleAuth = async (req, res) => {
  try {
    const { token, email, fullName, photoURL } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'Google token required.' });
    }

    // Verify Firebase ID token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ error: 'invalid Google token.' });
    }

    // Verify email matches
    if (decoded.email !== email) {
      return res.status(400).json({ error: 'email mismatch.' });
    }

    // Check if user exists in our DB
    let user = await findUserByEmail(email);

    if (!user) {
      // New Google user - create minimal profile
      const newUserId = await createUser({
        fullName: fullName || decoded.name || email.split('@')[0],
        email: email,
        phone: '',
        city: '',
        area: null,
        cnic: '',
        signupMethod: 'google',
      });

      // ✅ Create wallet with 5000 RS
      await walletModel.createWallet(newUserId, 5000);

      const profilePicUrl = photoURL || null;

      user = {
        UserID: newUserId,
        FullName: fullName || decoded.name || email.split('@')[0],
        Email: email,
        Phone: '',
        City: '',
        Area: null,
        CNIC: '',
        ProfilePic: profilePicUrl,
        IsVerified: true,
        IsBanned: false,
        Role: 'user',
        CreatedAt: new Date(),
      };

      return res.status(201).json({
        message: 'Google account created. Please complete your profile.',
        user: {
          id: user.UserID,
          fullName: user.FullName,
          email: user.Email,
          role: user.Role,
          profilePic: user.ProfilePic,
          isVerified: user.IsVerified,
        },
        requiresProfileCompletion: true,
      });
    }

    // Existing user - check if banned
    if (user.IsBanned) {
      return res.status(403).json({ error: 'your account has been suspended.' });
    }

    // ✅ SAFETY NET: Ensure existing Google user has wallet with 5000 RS
    try {
      const wallet = await walletModel.getBalance(user.UserID);
      if (!wallet) {
        console.log(`🔧 Safety Net: Creating wallet for Google user ${user.UserID} with 5000 RS`);
        await walletModel.createWallet(user.UserID, 5000);
      } else if (parseFloat(wallet.Balance) <= 0) {
        console.log(`🔧 Safety Net: Topping up Google user ${user.UserID} wallet to 5000 RS`);
        await walletModel.addMoney(user.UserID, 5000);
      }
    } catch (err) {
      console.error('Wallet safety net error:', err);
    }

    const needsCompletion = !user.Phone && !user.CNIC;

    res.json({
      message: 'Google sign-in successful',
      user: {
        id:         user.UserID,
        fullName:   user.FullName,
        email:      user.Email,
        phone:      user.Phone,
        city:       user.City,
        area:       user.Area,
        role:       user.Role || 'user',
        profilePic: user.ProfilePic,
        isVerified: user.IsVerified,
      },
      requiresProfileCompletion: needsCompletion,
    });
  } catch (err) {
    console.error(' googleAuth error:', err.message);
    res.status(500).json({ error: 'something went wrong. please try again.' });
  }
};

// ─── CHECK PROVIDER ──────────────────────────────────────────────────────────
const checkProvider = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    console.log('🔍 Checking provider for:', email);

    const user = await findUserByEmail(email);

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'user not found' });
    }

    const provider = user.SignupMethod || 'email';
    console.log('🎯 Provider:', provider);

    res.json({
      provider: provider,
      email: user.Email,
      hasCompleteProfile: !!user.Phone && !!user.CNIC,
    });
  } catch (err) {
    console.error('❌ checkProvider error:', err.message);
    res.status(500).json({ error: 'something went wrong' });
  }
};

// ─── CHECK USER STATUS ───────────────────────────────────────────────────────
const checkUserStatus = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const user = await findUserByEmail(email);

    res.json({
      exists: !!user,
      isVerified: user?.IsVerified || false,
      email: email,
    });
  } catch (err) {
    console.error('check-user-status error:', err.message);
    res.status(500).json({ error: 'something went wrong' });
  }
};

module.exports = { register, login, googleAuth, checkProvider, checkUserStatus };