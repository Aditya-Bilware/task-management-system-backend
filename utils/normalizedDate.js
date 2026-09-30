const normalizeDate = (date) => {
  const d = new Date(date);

  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  return new Date(`${istDate}T00:00:00+05:30`);
};

module.exports = { normalizeDate };
