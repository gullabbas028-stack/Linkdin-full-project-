import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      message: "Authentication is not configured",
    });
  }

  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default isAuth;