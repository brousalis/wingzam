import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { FaPause, FaPlay, FaTimes } from 'react-icons/fa';

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

const BirdModal: React.FC<{
  bird: Bird;
  isOpen: boolean;
  onClose: () => void;
}> = ({ bird, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audio = useMemo(
    () => new Audio(bird.recording.file),
    [bird.recording.file]
  );

  const handlePlaySound = () => {
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    } else {
      audio.pause();
      setIsPlaying(false); // Stop playback when modal closes
    }

    return () => {
      audio.pause(); // Ensure audio is stopped when component unmounts
      audio.currentTime = 0; // Reset audio to the beginning
    };
  }, [isOpen, audio]);

  const embedMapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyCLBPO0_IFfGjsLTJa2Zaj1hnP73-O0YUU&center=${bird.recording.lat},${bird.recording.lng}&zoom=10`;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as='div'
          className='relative z-10'
          onClose={onClose}
          open={isOpen}
        >
          <div className='fixed inset-0 bg-black bg-opacity-50' />
          <motion.div
            className='fixed inset-0 overflow-y-auto flex items-center justify-center p-4'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Dialog.Panel className='w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl'>
              <div className='flex justify-between items-center border-b p-4'>
                <Dialog.Title className='text-lg font-medium text-gray-900'>
                  {bird.common_name}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <FaTimes />
                </button>
              </div>

              <div className='p-4'>
                {/* <img
                  src={`https:${bird.recording.sono.med}`}
                  alt={`${bird.common_name} sonogram`}
                  className='w-full h-40 object-cover rounded-md mb-4'
                /> */}
                <div className='space-y-2 max-h-40 overflow-y-auto'>
                  <p>
                    <strong>Scientific Name:</strong> {bird.scientific_name}
                  </p>
                  <p>
                    <strong>Expansion:</strong> {bird.expansion}
                  </p>
                  <p>
                    <strong>Color:</strong> {bird.color}
                  </p>
                  <p>
                    <strong>Power:</strong> {bird.power_text || 'N/A'}
                  </p>
                  <p>
                    <strong>Wingspan:</strong> {bird.wingspan} cm
                  </p>
                  {bird.note && (
                    <p className='text-sm text-gray-500 italic'>
                      <strong>Note:</strong> {bird.note}
                    </p>
                  )}
                </div>
                <iframe
                  src={embedMapUrl}
                  className='w-full h-40 rounded-md border mt-4'
                  allowFullScreen
                  loading='lazy'
                ></iframe>
              </div>

              <div className='flex justify-between items-center border-t p-4'>
                <button
                  onClick={onClose}
                  className='bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300'
                >
                  Close
                </button>
                <button
                  onClick={handlePlaySound}
                  className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2'
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </Dialog.Panel>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default BirdModal;
