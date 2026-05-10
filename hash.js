const bcrypt = require("bcrypt");
(async () => {
  const hash = await bcrypt.hash("123456", 10);
  console.log(hash);
})();
