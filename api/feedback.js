// In-memory storage (resets on cold start - for production use a database)
// This is a simple demo - for production, use Vercel KV, Supabase, or similar
const feedbackStore = new Map();

export default function handler(req, res) {
  // Enable CORS for Make.com
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Store feedback from Make.com/OpenAI
  if (req.method === 'POST') {
    const { 
      id,           // Unique ID (from Jotform submission ID or generated)
      name,         // User's name
      feedback,     // The OpenAI generated feedback
      sleepScore,   // Optional: sleep quality score
      painScore,    // Optional: back pain score
      recommendations, // Optional: array of recommendations
      timestamp 
    } = req.body;

    if (!id || !feedback) {
      return res.status(400).json({ 
        error: 'Missing required fields: id and feedback are required' 
      });
    }

    const feedbackData = {
      id,
      name: name || 'Guest',
      feedback,
      sleepScore: sleepScore || null,
      painScore: painScore || null,
      recommendations: recommendations || [],
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    feedbackStore.set(id, feedbackData);

    console.log(`[Feedback API] Stored feedback for ID: ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Feedback stored successfully',
      id: id,
      redirectUrl: `/?id=${id}`
    });
  }

  // GET: Retrieve feedback by ID
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      // Return all stored IDs (for debugging)
      return res.status(200).json({
        message: 'Provide an ?id= parameter to retrieve feedback',
        storedIds: Array.from(feedbackStore.keys()),
        totalStored: feedbackStore.size
      });
    }

    const feedbackData = feedbackStore.get(id);

    if (!feedbackData) {
      return res.status(404).json({
        error: 'Feedback not found',
        id: id,
        hint: 'The feedback may have expired or the ID is incorrect'
      });
    }

    return res.status(200).json({
      success: true,
      data: feedbackData
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
