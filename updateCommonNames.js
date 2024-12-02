import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to generate alternate names
function generateAlternateNames(commonName) {
  const lowerName = commonName.toLowerCase();
  const noPunctuation = lowerName.replace(/[^\w\s]/g, ''); // Remove punctuation
  const withHyphens = lowerName.replace(/\s+/g, '-'); // Replace spaces with hyphens
  const withSpaces = lowerName.replace(/-/g, ' '); // Replace hyphens with spaces

  // Return unique variations
  return Array.from(
    new Set([lowerName, noPunctuation, withHyphens, withSpaces])
  );
}

// Function to enrich the master data
async function enrichMasterData(inputFilePath, outputFilePath) {
  try {
    // Read and parse the input file
    const data = JSON.parse(await readFile(inputFilePath, 'utf-8'));

    // Enrich the data with alternate names
    data.forEach((bird) => {
      if (bird.common_name) {
        bird.common_names = generateAlternateNames(bird.common_name);
      }
    });

    // Write the enriched data to a new file
    await writeFile(outputFilePath, JSON.stringify(data, null, 2));
    console.log(`Enriched data written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error processing the file:', error.message);
  }
}

// Paths for the input and output files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFilePath = path.join(__dirname, 'public/master.json'); // Replace with your actual file path
const outputFilePath = path.join(__dirname, 'public/enriched_master.json');

// Run the enrichment
enrichMasterData(inputFilePath, outputFilePath);
