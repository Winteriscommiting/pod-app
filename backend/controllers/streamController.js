const fs = require('fs');
const Podcast = require('../models/Podcast');

exports.streamPodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Check if we have an audio file to stream
    if ((podcast.status === 'completed' || podcast.generationStatus === 'completed') && 
        podcast.audioPath && fs.existsSync(podcast.audioPath)) {
      
      const stat = fs.statSync(podcast.audioPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Support range requests for streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(podcast.audioPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Send the whole file
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg',
        };
        res.writeHead(200, head);
        fs.createReadStream(podcast.audioPath).pipe(res);
      }
    } else {
      return res.status(404).json({ message: 'Audio file not available for streaming' });
    }
  } catch (error) {
    console.error('Stream podcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
