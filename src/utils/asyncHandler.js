const asyncHandler = (reqHandler) => {
  return async (req, res, next) => {
    try {
      await reqHandler(req, res, next);
      console.log(req.body);
    } catch (error) {
      res.status(error.code || 500).json({
        success: false,
        message: error.message,
      });
    }
  };
};
/*const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};*/

export { asyncHandler };
