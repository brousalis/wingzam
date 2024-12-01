import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { FaFeather } from 'react-icons/fa';
import './index.css';

interface BirdInfo {
  name: string;
  description: string;
  image: string | null;
}

const App: React.FC = () => {
  const [listening, setListening] = useState<boolean>(false);
  const [birdName, setBirdName] = useState<string>('');
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [birdInfo, setBirdInfo] = useState<BirdInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [buttonMoved, setButtonMoved] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleListen = async () => {
    setError('');
    if (!navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = '';

      if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        mimeType = 'audio/webm; codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
        mimeType = 'audio/ogg; codecs=opus';
      } else {
        setError('No supported audio format found.');
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.onstart = () => {
        setListening(true);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setListening(false);
        setLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToServer(audioBlob, mimeType);
        setLoading(false);
      };

      mediaRecorderRef.current.start();
      setTimeout(() => {
        mediaRecorderRef.current?.stop();
      }, 5000);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Could not start audio recording.');
    }
  };

  const sendAudioToServer = async (audioBlob: Blob, mimeType: string) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = String.fromCharCode(...uint8Array);
      const base64Audio = btoa(binaryString);

      const response = await axios.post(
        '/api/transcribe',
        { audioData: base64Audio, mimeType },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const name = response.data.transcript;
      if (name) {
        setBirdName(name);
        fetchAudio(name);
      } else {
        setError('No transcription available.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio.');
    }
  };

  const fetchAudio = async (name: string) => {
    try {
      const response = await axios.get('/api/getRecording', {
        params: { query: name },
      });

      const data = response.data;

      if (data.numSpecies !== '1') {
        setError('Could not uniquely identify the bird.');
        setAudioSrc(null);
        setBirdInfo(null);
        return;
      }

      if (data.recordings && data.recordings.length > 0) {
        const recording = data.recordings[0];
        const audioUrl = recording.file.startsWith('http')
          ? recording.file
          : `https:${recording.file}`;
        setAudioSrc(audioUrl);
        setError('');
        fetchBirdInfo(recording.en);
        setButtonMoved(true);
      } else {
        setError('No recordings found for this bird.');
        setAudioSrc(null);
      }
    } catch (err) {
      console.error('Fetch audio error:', err);
      setError('Failed to fetch audio.');
    }
  };

  const fetchBirdInfo = async (name: string) => {
    try {
      const response = await axios.get<BirdInfo>('/api/birdInfo', {
        params: { name },
      });
      setBirdInfo(response.data);
    } catch (err) {
      console.error('Fetch bird info error:', err);
      setBirdInfo(null);
    }
  };

  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1 className='app-title'>Wingzam</h1>
      </header>

      <div className='content-wrapper'>
        <motion.div
          className='relative'
          animate={buttonMoved ? { y: '50vh' } : { y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            className='listen-button'
            onClick={handleListen}
            disabled={listening}
            whileTap={{ scale: 0.9 }}
          >
            <FaFeather size={50} />
          </motion.button>

          <AnimatePresence>
            {listening && (
              <motion.div
                className='ripple'
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 0.6, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {loading && (
          <div className='loader mt-4 mx-auto border-t-4 border-white w-12 h-12 rounded-full animate-spin'></div>
        )}
        {error && <div className='text-red-500 mt-4'>{error}</div>}

        <AnimatePresence>
          {audioSrc && !loading && (
            <motion.div
              className='audio-player mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className='text-xl font-semibold'>Playing: {birdName}</p>
              <audio
                src={audioSrc}
                controls
                autoPlay
                className='mt-2 mx-auto'
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {birdInfo && (
            <motion.div
              className='bird-info mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className='text-2xl font-bold'>{birdInfo.name}</h2>
              {birdInfo.image && (
                <img
                  src={birdInfo.image}
                  alt={birdInfo.name}
                  className='mt-4 mx-auto rounded-lg shadow-lg'
                />
              )}
              <p className='mt-4'>{birdInfo.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className='app-footer'>
        <p>&copy; {new Date().getFullYear()} Wingzam</p>
      </footer>
    </div>
  );
};

export default App;
