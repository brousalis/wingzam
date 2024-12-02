import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { FaFeather } from 'react-icons/fa';
import BirdModal from './BirdModal.tsx';
import './index.css';

interface Bird {
  id: number;
  common_name: string;
  scientific_name: string;
  expansion: string;
  color: string;
  power_text: string;
  wingspan: string;
  note?: string;
  recording: {
    lat: string;
    lng: string;
    file: string;
    sono: {
      med: string;
    };
  };
}

const App: React.FC = () => {
  const [bird, setBird] = useState<Bird | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [listening, setListening] = useState<boolean>(false);
  const [listeningText, setListeningText] = useState<string>(
    'listening for bird names'
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (listening) {
      timeout = setTimeout(() => {
        setListeningText('still listening for bird names');
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [listening]);

  useEffect(() => {
    if (!listening && interimTranscript) {
      const timeout = setTimeout(() => setInterimTranscript(''), 5000);
      return () => clearTimeout(timeout);
    }
  }, [listening, interimTranscript]);

  const handleListen = () => {
    if (bird) {
      setBird(null);
      setError('');
      setInterimTranscript('');
      setListening(true);
      setListeningText('listening for bird names');
      return;
    }

    setError('');
    setInterimTranscript('');
    setListening(true);
    setListeningText('listening for bird names');

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('sorry speech recognition broken');
      setListening(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          setInterimTranscript('');
          findBird(transcript);
        } else {
          interim += result[0].transcript;
          setInterimTranscript(interim);
        }
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('speech recognition error:', event.error);
      setError('please try again');
      setListening(false);
    };

    recognitionRef.current.onend = () => {
      setListening(false);
    };

    recognitionRef.current.start();
  };

  const findBird = async (name: string) => {
    setLoading(true);
    const birdData = await fetch('/master.json').then((res) => res.json());
    const birdMatch = birdData.find(
      (bird: Bird) => bird.common_name.toLowerCase() === name.toLowerCase()
    );
    if (birdMatch) {
      setBird(birdMatch as Bird);
      setError('');
      setListening(false);
      setIsModalOpen(true); // Open modal when bird is found
    } else {
      setBird(null);
      setError(`no bird "${name.toLowerCase()}"`);
      setListening(false);
    }
    setLoading(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBird(null); // Reset bird when modal closes
  };

  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1 className='app-title'>wingzam</h1>
      </header>

      <div className='content-wrapper'>
        <AnimatePresence>
          {listening && (
            <motion.div
              className='listening-text text-xl mt-4'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {listeningText}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className='listen-container'
          initial={{ y: 0, scale: 1 }}
          animate={{ y: 0, scale: bird ? 0.7 : 1 }}
          exit={{ y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {listening && !bird ? (
            <>
              <motion.div
                className='ripple ripple-1'
                initial={{ scale: 0, opacity: 0.4 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
              <motion.div
                className='ripple ripple-2'
                initial={{ scale: 0, opacity: 0.3 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  duration: 2.0,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
              <motion.div
                className='ripple ripple-3'
                initial={{ scale: 0, opacity: 0.2 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              />
            </>
          ) : null}

          <motion.button
            className='listen-button depth'
            onClick={handleListen}
            disabled={loading}
            whileTap={{ scale: 0.9 }}
          >
            {loading ? (
              <div className='loader border-t-4 border-white w-12 h-12 rounded-full'></div>
            ) : (
              <span role='img' aria-label='feather'>
                <FaFeather size={40} />
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {interimTranscript && (
              <motion.div
                className='live-caption text-2xl font-semibold mt-4'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {interimTranscript.toLowerCase()}
              </motion.div>
            )}
          </AnimatePresence>
          {error && <div className='error-message'>{error}</div>}
        </motion.div>
      </div>

      {isModalOpen && (
        <BirdModal bird={bird!} isOpen={isModalOpen} onClose={closeModal} />
      )}

      <footer className='app-footer'>
        <span>made by</span> <span className='name'>pete</span>
      </footer>
    </div>
  );
};

export default App;
