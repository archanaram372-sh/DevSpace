const express = require("express");
const cors = require("cors");
const { VM } = require("vm2");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/run", (req, res) => {
  try {
    const vm = new VM();
    const result = vm.run(req.body.code);
    res.json({ output: result });
  } catch (err) {
    res.json({ output: err.toString() });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});