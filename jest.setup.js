// jest.setup.js
beforeAll(() => {
  // لو عايز تشوف logs وقت الديباج
  if (process.env.DEBUG_AUTH === "1") return;

  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  if (console.log && typeof console.log.mockRestore === "function") {
    console.log.mockRestore();
  }
});
