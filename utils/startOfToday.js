const getStartOfTodayIST = () => {
  const nowInIST = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    }),
  );

  nowInIST.setHours(0, 0, 0, 0);

  return new Date(nowInIST.getTime());
};

module.exports = { getStartOfTodayIST };
