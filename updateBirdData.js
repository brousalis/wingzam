import axios from 'axios';
import fs from 'fs/promises';

// Utility function to convert keys to snake_case
const toSnakeCase = (str) => {
  return str
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
};

// Delay function to respect API throttling
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// File paths
const dataFile = './public/test.json';
const outputFile = './public/master.json';

(async () => {
  try {
    // Load the bird data from data.json
    const rawData = await fs.readFile(dataFile, 'utf-8');
    const birds = JSON.parse(rawData);

    const updatedBirds = [];

    for (const bird of birds) {
      const updatedBird = {};

      // Convert keys to snake_case
      for (const [key, value] of Object.entries(bird)) {
        updatedBird[toSnakeCase(key)] = value;
      }

      // Query the API for additional information using the scientific name
      const scientificName = encodeURIComponent(updatedBird.scientific_name);
      const apiUrl = `https://xeno-canto.org/api/2/recordings?query=${scientificName}`;

      try {
        const response = await axios.get(apiUrl);
        if (
          response.data &&
          response.data.recordings &&
          response.data.recordings.length > 0
        ) {
          const recording = response.data.recordings[0]; // Use the first result

          // Add the full recording object
          updatedBird.recording = recording;

          // Construct a special key for the frontend to play the sound
          updatedBird.frontend_sound_url = `https:${recording.file}`;
        }
      } catch (apiError) {
        console.error(
          `Error querying API for bird: ${updatedBird.scientific_name}`,
          apiError.message
        );
      }

      updatedBirds.push(updatedBird);

      // Respect API throttling: wait 1 second between requests
      await delay(1000);
    }

    // Save the updated data to master.json
    await fs.writeFile(outputFile, JSON.stringify(updatedBirds, null, 2));
    console.log(`Master data saved to ${outputFile}`);
  } catch (err) {
    console.error('Error processing bird data:', err.message);
  }
})();
