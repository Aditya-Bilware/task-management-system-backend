const normalizeDate = (date) => {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  // return d;
};

module.exports = { normalizeDate };
