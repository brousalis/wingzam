import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required.' });
    return;
  }

  try {
    const lowerCaseQuery = query.toLowerCase();

    // Replace spaces with '+' to match xeno-canto API expectations
    const formattedQuery = lowerCaseQuery.trim().replace(/\s+/g, '+');

    const apiUrl = `https://xeno-canto.org/api/2/recordings?query=${formattedQuery}`;

    const response = await axios.get(apiUrl);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data from xeno-canto:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch data from xeno-canto API.' });
  }
}
