const fs = require("fs");
const https = require("https");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    https.createServer(
        {
          key: fs.readFileSync("./localhost-key.pem"),
          cert: fs.readFileSync("./localhost.pem"),
        },
        (req, res) => {
          handle(req, res);
        }
      ).listen(3000, '0.0.0.0', (err) => {
        if (err) throw err;
        console.log("> Ready on https://0.0.0.0:3000");
      });
      
});
