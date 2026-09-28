import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";

// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    console.log("SIGNUP BODY:", req.body);

    const {
      firstName,
      lastName,
      userName,
      email,
      password,
    } = req.body || {};

    // Check required fields
    if (!firstName || !lastName || !userName || !email || !password) {
      return res.status(400).json({
        message:
          "First name, last name, username, email, and password are required",
      });
    }

    // Check password length
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Check existing email
    const existEmail = await User.findOne({ email });

    if (existEmail) {
      return res.status(400).json({
        message: "User already exists!",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({
      userName: userName,
    });

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already exists!",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password: hashedPassword,
    });

    // Generate JWT
    const token = await genToken(user._id);

    // Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });

  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      message: "Error occurred while signing up",
      error: error.message,
    });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const ismatch = await User.findOne({ email });

    if (!ismatch) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(
      password,
      ismatch.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // Generate JWT
    const token = await genToken(ismatch._id);

    // Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "Login successful",
      user: ismatch,
      token,
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Error occurred while logging in",
      error: error.message,
    });
  }
};


// ================= LOGOUT =================
export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "Logout successful",
    });

  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      message: "Error occurred while logging out",
    });
  }
};