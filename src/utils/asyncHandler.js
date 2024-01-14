/*const asyncHandler = (reqHandler) => {
  return async (req, res, next) => {
    try {
      await reqHandler(req, res, next);
    } catch (error) {
      res.status(error.code || 500).json({
        success: false,
        message: `${error},asynchandler problem`,
      });
    }
  };
};*/
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
