module.exports = {
  testEnvironment: "node",

  // ❌ لا تستخدم setupFiles هنا للتست hooks
  // setupFiles: ["<rootDir>/jest.setup.js"],

  // ✅ ده الصح
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  testMatch: ["**/__tests__/**/*.test.js"],
};
