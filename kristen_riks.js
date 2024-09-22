const audioPlayer = document.getElementById('audio-player');
const playButton = document.getElementById('play-button');
const volumeSlider = document.querySelector('#volume-slider input');
const socket = new WebSocket("wss://radio.p7.no/api/live/nowplaying/websocket");

playButton.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playButton.innerHTML = '<i class="fas fa-stop"></i>';
  } else {
    audioPlayer.pause();
    playButton.innerHTML = '<i class="fas fa-play"></i>';
  }
});

volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = volumeSlider.value / 100;
});

const volumeButton = document.getElementById('volume-button');

volumeButton.addEventListener('click', () => {
  if (audioPlayer.muted) {
    audioPlayer.muted = false;
    volumeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
  } else {
    audioPlayer.muted = true;
    volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
  }
});

volumeSlider.addEventListener('input', () => {
  if (volumeSlider.value === '0') {
    volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (volumeSlider.value > 0 && volumeSlider.value < 50) {
    volumeButton.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    volumeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
});

volumeSlider.addEventListener('input', () => {
  if (audioPlayer.muted) {
    audioPlayer.muted = false;
    volumeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
});

socket.onopen = function(e) {
  socket.send(JSON.stringify({
    "subs": {
      "station:p7_kristen_riksradio": {"recover": true}
    }
  }));
}

let nowplaying = {};
let currentTime = 0;

function handleSseData(ssePayload, useTime = true) {
  const jsonData = ssePayload.data;

  if (useTime && 'current_time' in jsonData) {
    currentTime = jsonData.current_time;
  }

  nowPlaying = jsonData.np.now_playing;
  nowplayingArtist = jsonData.np.now_playing.song.artist;
  nowplayingTitle = jsonData.np.now_playing.song.title;
  nowplayingArt = jsonData.np.now_playing.song.art;

  document.getElementById('track-title-text').textContent = nowplayingTitle;
  document.getElementById('track-artist-text').textContent = nowplayingArtist;
  document.getElementById('cover-art-image').src = nowplayingArt;
}

socket.onmessage = function(e) {
  const jsonData = JSON.parse(e.data); 

  if ('connect' in jsonData) {
    const connectData = jsonData.connect;

    if ('data' in connectData) {
      connectData.data.forEach(
        (initialRow) => handleSseData(initialRow)
      );
    } else {
      if ('time' in connectData) {
        currentTime = Math.floor(connectData.time / 1000);
      }
      for (const subName in connectData.subs) {
        const sub = connectData.subs[subName];
        if ('publications' in sub && sub.publications.length > 0) {
          sub.publications.forEach((initialRow) => handleSseData(initialRow, false));
        }
      }
    }
  } else if ('pub' in jsonData) {
    handleSseData(jsonData.pub);
  }
};