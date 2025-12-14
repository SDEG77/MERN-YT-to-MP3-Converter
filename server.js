const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();

app.use(express.json());
app.use(require("cors")());

app.listen('3030', () => {
  console.log("Server running on port 3030! \n\n http://127.0.0.1:3030/convert");
});

app.post('/convert', (req, res) => {
  const { url } = req.body;
  const { title } = req.body;

  const output = `${title}_${Date.now()}`;

  const ytToMp3 = path.join(__dirname, "tools", "yt-dlp.exe");
  const ffempeg = path.join(__dirname, "tools", "ffmpeg.exe");

  const command = `${ytToMp3} -x --audio-format mp3 --ffmpeg-location "${ffempeg}" "${url}" -o "audio_files/${output}.%(ext)s"`;

  exec(command, (err) => {
    if (err) {
      return res.status(500).json({
        error: `Convertion Failed ${err.message}`
      })
    }

    res.json({ message: "success :)", file: output });
  });
});