import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/user.model.js";

test(
  "signup, cookie authentication, logout, and login",
  { skip: !process.env.MONGO_URI && "MONGO_URI is required for auth integration tests" },
  async () => {
    const originalEnvironment = {
      mongoUri: process.env.MONGO_URI,
      jwtSecret: process.env.JWT_SECRET,
      frontendUrl: process.env.FRONTEND_URL,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    };
    const testDatabase = `auth_test_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const isolatedMongoUri = new URL(process.env.MONGO_URI);
    isolatedMongoUri.pathname = `/${testDatabase}`;

    process.env.MONGO_URI = isolatedMongoUri.toString();
    process.env.JWT_SECRET ||= randomUUID();
    process.env.FRONTEND_URL = "https://auth-test.example";
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";

    let server;
    let baseUrl;
    const email = `auth-${randomUUID()}@example.test`;
    const userName = `auth_${randomUUID().replaceAll("-", "")}`;
    const password = "integration-test-password";

    const send = async (path, { method = "GET", body, cookie, headers = {} } = {}) => {
      const requestHeaders = { ...headers };
      if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
      if (cookie) requestHeaders.Cookie = cookie;

      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      return {
        response,
        data: await response.text().then((body) => (body ? JSON.parse(body) : null)),
        setCookie: response.headers.get("set-cookie") || "",
      };
    };

    try {
      process.env.VERCEL = "1";
      const { default: app } = await import("../index.js");
      await connectDB();

      server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
        listener.once("error", reject);
      });
      baseUrl = `http://127.0.0.1:${server.address().port}`;

      const allowedCors = await send("/api/auth/signup", {
        method: "OPTIONS",
        headers: {
          Origin: process.env.FRONTEND_URL,
          "Access-Control-Request-Method": "POST",
        },
      });
      assert.equal(allowedCors.response.status, 204);
      assert.equal(
        allowedCors.response.headers.get("access-control-allow-credentials"),
        "true"
      );

      const deniedCors = await send("/api/auth/signup", {
        method: "OPTIONS",
        headers: {
          Origin: "https://untrusted.example",
          "Access-Control-Request-Method": "POST",
        },
      });
      assert.equal(deniedCors.response.status, 403);

      const unauthenticated = await send("/api/user/currentuser");
      assert.equal(unauthenticated.response.status, 401);

      const missingFields = await send("/api/auth/signup", {
        method: "POST",
        body: {},
      });
      assert.equal(missingFields.response.status, 400);

      const invalidEmail = await send("/api/auth/signup", {
        method: "POST",
        body: {
          firstName: "Test",
          lastName: "User",
          userName,
          email: "not-an-email",
          password,
        },
      });
      assert.equal(invalidEmail.response.status, 400);

      const signupBody = {
        firstName: "Test",
        lastName: "User",
        userName,
        email,
        password,
      };

      const configuredSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      const missingJwtSecret = await send("/api/auth/signup", {
        method: "POST",
        body: signupBody,
      });
      assert.equal(missingJwtSecret.response.status, 503);
      process.env.JWT_SECRET = configuredSecret;
      assert.equal(await User.countDocuments({ email }), 0);

      const configuredMongoUri = process.env.MONGO_URI;
      process.env.MONGO_URI = "";
      const missingMongoUri = await send("/api/auth/signup", {
        method: "POST",
        body: signupBody,
      });
      assert.equal(missingMongoUri.response.status, 503);
      process.env.MONGO_URI = configuredMongoUri;

      const signup = await send("/api/auth/signup", {
        method: "POST",
        body: signupBody,
      });
      assert.equal(signup.response.status, 201, signup.data.message);
      assert.equal(signup.data.user.email, email);
      assert.equal("password" in signup.data.user, false);
      assert.equal("token" in signup.data, false);
      assert.match(signup.setCookie, /HttpOnly/i);
      assert.match(signup.setCookie, /Secure/i);
      assert.match(signup.setCookie, /Path=\//i);

      const signupCookie = signup.setCookie.split(";")[0];
      const currentUser = await send("/api/user/currentuser", {
        cookie: signupCookie,
      });
      assert.equal(currentUser.response.status, 200);
      assert.equal(currentUser.data.user.email, email);
      assert.equal("password" in currentUser.data.user, false);

      const storedUser = await User.findOne({ email }).select("+password");
      assert.ok(storedUser);
      assert.notEqual(storedUser.password, password);
      assert.equal(await bcrypt.compare(password, storedUser.password), true);

      const duplicateEmail = await send("/api/auth/signup", {
        method: "POST",
        body: { ...signupBody, userName: `${userName}_other` },
      });
      assert.equal(duplicateEmail.response.status, 409);

      const duplicateUsername = await send("/api/auth/signup", {
        method: "POST",
        body: { ...signupBody, email: `other-${email}` },
      });
      assert.equal(duplicateUsername.response.status, 409);

      const protectedConnections = await send("/api/connections", {
        cookie: signupCookie,
      });
      assert.equal(protectedConnections.response.status, 200);

      const logout = await send("/api/auth/logout", {
        cookie: signupCookie,
      });
      assert.equal(logout.response.status, 200);
      assert.match(logout.setCookie, /Expires=Thu, 01 Jan 1970/i);
      const afterLogout = await send("/api/user/currentuser");
      assert.equal(afterLogout.response.status, 401);

      const login = await send("/api/auth/login", {
        method: "POST",
        body: { email: email.toUpperCase(), password },
      });
      assert.equal(login.response.status, 200);
      assert.equal("password" in login.data.user, false);
      assert.equal("token" in login.data, false);

      const afterLogin = await send("/api/user/currentuser", {
        cookie: login.setCookie.split(";")[0],
      });
      assert.equal(afterLogin.response.status, 200);
      assert.equal(afterLogin.data.user.userName, userName);
    } finally {
      if (server) {
        const serverClosed = new Promise((resolve) => server.close(resolve));
        server.closeAllConnections();
        await serverClosed;
      }
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
      }
      await mongoose.disconnect();

      if (originalEnvironment.mongoUri === undefined) delete process.env.MONGO_URI;
      else process.env.MONGO_URI = originalEnvironment.mongoUri;
      if (originalEnvironment.jwtSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = originalEnvironment.jwtSecret;
      if (originalEnvironment.frontendUrl === undefined) delete process.env.FRONTEND_URL;
      else process.env.FRONTEND_URL = originalEnvironment.frontendUrl;
      if (originalEnvironment.nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnvironment.nodeEnv;
      if (originalEnvironment.vercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = originalEnvironment.vercel;
    }
  }
);