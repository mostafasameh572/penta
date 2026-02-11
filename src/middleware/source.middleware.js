module.exports = (req, res, next) => {
  // افتراضيًا أي تعديل جاي من أدمن
  req.source = "ADMIN";

  // مستقبلًا ممكن نغيرها لـ SYSTEM
  // لو جاي من internal service
  // مثال:
  // if (req.headers["x-system-key"]) {
  //   req.source = "SYSTEM";
  // }

  next();
};
