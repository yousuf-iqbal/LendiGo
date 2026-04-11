const verifyToken = async (req, res, next) => {
  req.userID = 5;
  next();
};

module.exports = verifyToken;