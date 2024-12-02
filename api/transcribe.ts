import { SpeechClient, protos } from '@google-cloud/speech';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';

// NOTE: NOT IN USE
const decodedCredentials = Buffer.from(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 || '',
  'base64'
).toString('utf8');

process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/key.json';

fs.writeFileSync('/tmp/key.json', decodedCredentials);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    console.log('Received body:', req.body); // Log the received body

    const { audioData } = req.body;

    if (!audioData) {
      res.status(400).send('No audio data received.');
      return;
    }

    const audioBuffer = Buffer.from(audioData, 'base64');

    const client = new SpeechClient();

    const audio: protos.google.cloud.speech.v1.IRecognitionAudio = {
      content: audioBuffer.toString('base64'),
    };

    const config: protos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding:
        protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };

    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      ?.map((result) => result.alternatives![0].transcript)
      .join('\n');
    res.status(200).json({ transcript: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).send('Transcription failed.');
  }
}
