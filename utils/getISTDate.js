const getISTDateString = (date) => {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};
module.exports = { getISTDateString };
