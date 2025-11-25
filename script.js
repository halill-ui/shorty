const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });

const dropArea = document.getElementById('drop-area');
const videoInput = document.getElementById('video-input');
const options = document.getElementById('options');
const startBtn = document.getElementById('start');
const progress = document.getElementById('progress');
const bar = document.getElementById('bar');
const percent = document.getElementById('percent');

let videoFile = null;

// FFmpeg yükle
(async () => {
  if (!ffmpeg.isLoaded()) await ffmpeg.load();
})();

// Sürükle-bırak
dropArea.onclick = () => videoInput.click();
videoInput.onchange = e => handleFile(e.target.files[0]);
dropArea.ondragover = e => { e.preventDefault(); dropArea.style.background = 'rgba(0,255,65,0.2)'; };
dropArea.ondragleave = () => dropArea.style.background = 'rgba(0,255,65,0.05)';
dropArea.ondrop = e => {
  e.preventDefault();
  dropArea.style.background = 'rgba(0,255,65,0.05)';
  handleFile(e.dataTransfer.files[0]);
};

document.getElementById('duration').oninput = e => document.getElementById('sec').textContent = e.target.value;

function handleFile(file) {
  if (!file || !file.type.startsWith('video/')) return alert('Video seç kanka!');
  videoFile = file;
  dropArea.classList.add('hidden');
  options.classList.remove('hidden');
}

startBtn.onclick = async () => {
  if (!videoFile) return;

  const duration = parseInt(document.getElementById('duration').value);
  const format = document.getElementById('format').value;

  options.classList.add('hidden');
  progress.classList.remove('hidden');

  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

  const info = await ffmpeg.run('-i', 'input.mp4');
  const vidDuration = videoFile.duration || 9999;

  // fallback

  let start = 0;
  let i = 1;

  while (start < vidDuration) {
    const output = `out${i}.mp4`;

    let filter = '';
    if (format === '9:16') filter = 'crop=ih*9/16:ih,scale=720:1280';
    else if (format === '1:1') filter = 'crop=ih:ih,scale=720:720';
    else filter = 'scale=1280:720';

    await ffmpeg.run(
      '-i', 'input.mp4',
      '-ss', start.toString(),
      '-t', duration.toString(),
      '-vf', filter,
      '-c:v', 'libx264', '-preset', 'fast',
      '-c:a', 'aac',
      output
    );

    const data = ffmpeg.FS('readFile', output);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DikeyKes_${i}.mp4`;
    a.click();

    start += duration;
    i++;
    bar.value = (start / vidDuration) * 100;
    percent.textContent = Math.round(bar.value);
  }

  alert('Bütün klipler indirildi kanka! 🔥');
  location.reload();
};
