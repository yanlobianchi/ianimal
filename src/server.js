const express = require('express');
const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname + "/" });
});
app.get("/index.js", (req, res) => {
    res.sendFile("index.js", { root: __dirname + "/" });
});

app.get("/resources/model.json", (req, res) => {
    res.sendFile("resources/model.json", { root: __dirname.replace('/src', '/') });
});

app.get("/resources/metadata.json", (req, res) => {
    res.sendFile("resources/metadata.json", { root: __dirname.replace('/src', '/') });
});

app.get("/resources/weights.bin", (req, res) => {
    res.sendFile("resources/weights.bin", { root: __dirname.replace('/src', '/') });
});

const apiRouter = express.Router();

app.use("/api", apiRouter);

app.listen(8080, () => console.log('App listening on port 8080!'));
