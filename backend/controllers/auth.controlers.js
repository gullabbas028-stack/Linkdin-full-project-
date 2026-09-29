import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
  path: "/",
};

const publicUser = (user) => {
  const result = user.toObject();
  delete result.password;
  return result;
};

const sendAuthError = (res, error, operation) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({
      message: field === "email" ? "Email already exists" : "Username already exists",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Signup details are invalid" });
  }

  console.error(`${operation} failed:`, error.name, error.code || "");
  return res.status(500).json({ message: `Unable to ${operation}` });
};

// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body || {};

    if (
      [firstName, lastName, userName, email, password].some(
        (value) => typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "First name, last name, username, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = userName.trim();

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message: "Authentication is not configured",
      });
    }

    // Check existing email
    const existEmail = await User.findOne({ email: normalizedEmail });

    if (existEmail) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({ userName: normalizedUsername });

    if (existingUsername) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Generate JWT
    const token = await genToken(user._id);

    // Store token in cookie
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "User created successfully",
      user: publicUser(user),
    });

  } catch (error) {
    return sendAuthError(res, error, "create account");
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message: "Authentication is not configured",
      });
    }

    // Find user by email
    const ismatch = await User.findOne({ email: normalizedEmail });

    if (!ismatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(
      password,
      ismatch.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = await genToken(ismatch._id);

    // Store token in cookie
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: publicUser(ismatch),
    });

  } catch (error) {
    return sendAuthError(res, error, "log in");
  }
};


// ================= LOGOUT =================
export const logout = (req, res) => {
  try {
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
      message: "Logout successful",
    });

  } catch (error) {
    console.error("Logout failed:", error.name, error.code || "");

    return res.status(500).json({
      message: "Error occurred while logging out",
    });
  }
};