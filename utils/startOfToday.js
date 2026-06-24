const getStartOfTodayIST = () => {
  return new Date(
    new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }),
  );
};

module.exports = { getStartOfTodayIST };
