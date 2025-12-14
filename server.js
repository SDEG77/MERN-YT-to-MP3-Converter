const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(require("cors")());
app.use('/audio_files', express.static(path.join(__dirname, 'audio_files')));

app.listen('3030', () => {
  console.log("Server running on port 3030! \n\n http://127.0.0.1:3030/convert");
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

function sanitizeFileName(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '_'); // replace illegal characters with _
}

app.post('/convert', (req, res) => {
  const { url, quality } = req.body; // receive quality from frontend
  const timestamp = Date.now();
  const outputTemplate = `audio_files/%(title)s_${timestamp}.%(ext)s`;

  const ytToMp3 = path.join(__dirname, "tools", "yt-dlp.exe");
  const ffmpeg = path.join(__dirname, "tools", "ffmpeg.exe");

  // Use quality argument in yt-dlp
  const command = `${ytToMp3} -x --audio-format mp3 --audio-quality "${quality || '0'}" --ffmpeg-location "${ffmpeg}" "${url}" -o "${outputTemplate}"`;

  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).json({ error: `Conversion Failed: ${err.message}` });
    }

    const match = stdout.match(/Destination: (.+\.mp3)/);
    if (!match) return res.status(500).json({ error: "Could not find output file" });

    const rawFileName = path.basename(match[1]);
    const sanitizedFileName = sanitizeFileName(rawFileName);

    const oldPath = path.join(__dirname, 'audio_files', rawFileName);
    const newPath = path.join(__dirname, 'audio_files', sanitizedFileName);

    if (oldPath !== newPath) fs.renameSync(oldPath, newPath);

    res.json({ message: "success :)", file: sanitizedFileName });
  });
});

