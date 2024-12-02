import type { VercelRequest, VercelResponse } from '@vercel/node';
import data from '../public/data.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to get birds' });
  }
}
