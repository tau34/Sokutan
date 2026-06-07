import { useState, useRef, useEffect } from 'react'
import "react-h5-audio-player/lib/styles.css";
import './App.css'
import { books } from './core/books';
import AudioPlayer from "react-h5-audio-player";

function App() {
  const [bookId, setBookId] = useState(0);
  const [audioId, setAudioId] = useState(0);
  const [trackNo, setTrackNo] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all" | "custom">("off");

  const audioRef = useRef<AudioPlayer>(null);
  const inputRangeRef = useRef<HTMLInputElement>(null);
  const book = books[bookId];

  const [customRepeatStart, setCustomRepeatStart] = useState(1);
  const [customRepeatEnd, setCustomRepeatEnd] = useState(book.number);

  function updateRate(rate: number) {
    if (audioRef.current) {
      audioRef.current.audio.current.playbackRate = rate;
    }
    setPlaybackRate(rate);

    const inputRange = inputRangeRef.current;
    if (!inputRange) return;
    const ratio = ((rate - 0.25) / (2.5 - 0.25)) * 100;
    inputRange.style.background = `linear-gradient(90deg, #868686 ${ratio}%, #dddddd ${ratio}%)`;
  }

  function moveTrack(offset: number) {
    //<<と>>でトラック移動する用
    const newTrackNo = trackNo + offset;
    if (newTrackNo < 1) {
      //+1or-1しか想定していない
      setTrackNo(newTrackNo + book.number);
      return;
    }
    if (newTrackNo > book.number) {
      setTrackNo(newTrackNo - book.number);
      return;
    }
    setTrackNo(newTrackNo);
  }

  function skipTime(offset: number) {
    if (audioRef.current) {
      const audio = audioRef.current.audio.current;
      audio.currentTime += offset;
    }
  }

  //リピートの実装
  function handleEnded() {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.audio.current.currentTime = 0;
        audioRef.current.audio.current.play();
      }
    } else if (repeatMode === "all") {
      moveTrack(1);
    } else if (repeatMode === "custom") {
      //所謂ABリピート
      if (trackNo < customRepeatStart || trackNo > customRepeatEnd) {
        setTrackNo(customRepeatStart);
      } else if (trackNo === customRepeatEnd) {
        setTrackNo(customRepeatStart);
      } else {
        moveTrack(1);
      }
    }
  }

  useEffect(() => {
    const inputRange = inputRangeRef.current;

    //速度変えるinput[type=range]のバーを更新
    function updateRateBar(e: HTMLElementEventMap['input']) {
      const inputRange = inputRangeRef.current;
      if (!inputRange) return;
      const target = e.target as HTMLInputElement | null;
      const value = Number(target?.value ?? inputRange.value);
      const min = Number(inputRange.min);
      const max = Number(inputRange.max);
      const ratio = ((value - min) / (max - min)) * 100;
      inputRange.style.background = `linear-gradient(90deg, #868686 ${ratio}%, #dddddd ${ratio}%)`;
    }

    inputRange?.addEventListener("input", updateRateBar);

    return () => {
      inputRange?.removeEventListener("input", updateRateBar);
    };
  }, []);

  //主にリピート処理のため
  useEffect(() => {
    const audio = audioRef.current?.audio.current;

    //trackNo === 0 : トラック未選択
    if (!audio || trackNo === 0) return;

    audio.playbackRate = playbackRate;

    audio.play().catch(() => { });

    if (audioRef.current && trackNo > 0) {
      audioRef.current.audio.current.playbackRate = playbackRate;
    }
  }, [trackNo]);

  //シーク操作による一時停止防ぐ
  useEffect(() => {
    const audio = audioRef.current?.audio.current;
    if (!audio) return;

    function handleSeeked() {
      // シーク直後に停止している場合は再生を試みる
      if (audio && audio.paused) {
        audio.play().catch(() => { });
      }
    }

    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [bookId, audioId, trackNo]);

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-3xl mb-4">速単音声プレイヤー</p>
      <label className="text-lg mb-4">
        <span className="mr-2">教材を選択:</span>
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={bookId}
          onChange={
            (e) => {
              setBookId(Number(e.target.value));
              //一応音声と番号リセット
              setAudioId(0);
              setTrackNo(0);
            }
          }
        >
          {books.map((book, index) => (
            <option key={book.title} value={index}>
              {book.title}
            </option>
          ))}
        </select>
      </label>
      <label className="text-lg mb-4">
        <span className="mr-2">音声のタイプを選択:</span>
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={audioId}
          onChange={(e) => setAudioId(Number(e.target.value))}
        >
          {book.audios.map((audio, index) => (
            <option key={audio.name} value={index}>
              {audio.name}
            </option>
          ))}
        </select>
      </label>
      {trackNo === 0 && <>
        <p className="text-lg mb-4">番号を選択:</p>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: book.number }, (_, i) => (
            <button
              key={i}
              className={`border border-gray-300 rounded px-4 py-1`}
              onClick={() => setTrackNo(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </>}
      {trackNo > 0 && (
        <p className="text-lg mb-4">
          {trackNo}.{book.sections[trackNo - 1]}
        </p>
      )}
      <div className="w-[80%] mb-6">
        <AudioPlayer
          src={`${book.audios[audioId].url}${trackNo.toString().padStart(2, '0')}.mp3`}
          showJumpControls={false}
          ref={audioRef}
          onEnded={handleEnded}
        />
      </div>
      <div className="text-lg mb-5 flex items-center">
        <button className="mr-3" onClick={() => moveTrack(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#868686">
            <polygon points="11,3 3,12 11,21" />
            <polygon points="21,3 13,12 21,21" />
          </svg>
        </button>
        <button
          className="mr-3 border border-gray-300 rounded px-4 py-1 mx-1"
          onClick={() => skipTime(-3)}
        >
          -3s
        </button>
        <button
          className="border border-gray-300 rounded px-4 py-1 mx-1"
          onClick={() => skipTime(3)}
        >
          +3s
        </button>
        <button className="ml-3" onClick={() => moveTrack(1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#868686">
            <polygon points="3,3 11,12 3,21" />
            <polygon points="13,3 21,12 13,21" />
          </svg>
        </button>
      </div>
      <p className="text-lg mb-2">
        再生速度:
        <label>
          <input
            type="number"
            min="0.25"
            max="2.5"
            step="0.05"
            value={playbackRate}
            onChange={(e) => {
              const rate = Number(e.target.value);
              updateRate(rate);
            }}
            className="rounded px-2 py-1 w-16 text-right"
          />
          x
        </label>
      </p>
      <input
        type="range"
        min="0.25"
        max="2.5"
        step="0.05"
        value={playbackRate}
        onChange={(e) => {
          const rate = Number(e.target.value);
          updateRate(rate);
        }}
        ref={inputRangeRef}
      />
      <div className="flex items-center mt-4 mb-4">
        {[0.8, 1, 1.2, 1.5].map((rate) => (
          <button
            key={rate}
            className={`border border-gray-300 rounded px-4 py-1 mx-1 ${playbackRate === rate ? 'bg-gray-300' : ''}`}
            onClick={() => updateRate(rate)}
          >
            {rate}x
          </button>
        ))}
      </div>
      <label className="text-lg mb-2">
        <span className="mr-2">リピート:</span>
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={repeatMode}
          onChange={(e) => setRepeatMode(e.target.value as "off" | "one" | "all" | "custom")}
        >
          <option value="off">オフ</option>
          <option value="one">トラック</option>
          <option value="all">ALL</option>
          <option value="custom">カスタム</option>
        </select>
      </label>
      {repeatMode === "custom" && (<>
        <label className="text-lg mb-2">
          <span className="mr-2">開始:</span>
          <input
            type="number"
            min="1"
            max={book.number}
            value={customRepeatStart}
            onChange={(e) => {
              const newStart = Number(e.target.value);
              setCustomRepeatStart(newStart);
              if (customRepeatEnd < newStart) {
                setCustomRepeatEnd(newStart);
              }
            }}
            className="border border-gray-300 rounded px-2 py-1 w-16"
          />
          <span className="ml-2 mr-2">終了:</span>
          <input
            type="number"
            min="1"
            max={book.number}
            value={customRepeatEnd}
            onChange={(e) => {
              const newEnd = Number(e.target.value);
              setCustomRepeatEnd(newEnd);
              if (customRepeatStart > newEnd) {
                setCustomRepeatStart(newEnd);
              }
            }}
            className="border border-gray-300 rounded px-2 py-1 w-16"
          />
        </label>
      </>)}
    </div>
  )
}

export default App
