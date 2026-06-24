const getStartOfTodayIST = () => {
  // const nowInIST = new Date(
  //   new Date().toLocaleString("en-US", {
  //     timeZone: "Asia/Kolkata",
  //   }),
  // );

  // nowInIST.setHours(0, 0, 0, 0);

  // return new Date(nowInIST.getTime());

  const now = new Date();

  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${istDate}T00:00:00+05:30`);
};

module.exports = { getStartOfTodayIST };
