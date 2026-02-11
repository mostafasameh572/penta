exports.success = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

exports.error = (res, message = "Something went wrong", status = 400) => {
  return res.status(status).json({
    success: false,
    message,
  });
};
