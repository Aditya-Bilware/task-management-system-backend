const reportDate = new Date()
  .toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  .replace(/\//g, "-");

module.exports = { reportDate };
