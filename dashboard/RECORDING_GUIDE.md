# SmileCoin Demo Recording Guide

## Quick Start Recording (macOS)

### Option 1: QuickTime Screen Recording (Recommended)
```bash
# 1. Open QuickTime Player
open -a "QuickTime Player"

# 2. Start new screen recording
# File > New Screen Recording
# Select microphone for audio
# Click record button
# Select browser window or full screen
```

### Option 2: Built-in Screenshot Tool (macOS Monterey+)
```bash
# Press Cmd+Shift+5 to open screenshot toolbar
# Select "Record Selected Portion" or "Record Entire Screen"
# Click Options to select microphone
# Click Record
```

### Option 3: Command Line with ffmpeg
```bash
# Install ffmpeg if not already installed
brew install ffmpeg

# Record screen with audio (replace with your audio device)
ffmpeg -f avfoundation -i "1:0" -r 30 -s 1920x1080 screen_recording.mov

# List available audio devices
ffmpeg -f avfoundation -list_devices true -i ""
```

## Demo Recording Checklist

### Before Recording
- [ ] Close all unnecessary applications
- [ ] Set browser to full screen (F11 or Cmd+Shift+F)
- [ ] Start web dashboard: `cd web-dashboard && npm start`
- [ ] Navigate to http://localhost:3001
- [ ] Test audio levels
- [ ] Practice demo flow 2-3 times
- [ ] Have demo script nearby for reference

### During Recording
- [ ] Speak clearly and at moderate pace
- [ ] Allow 2-3 seconds between major transitions
- [ ] Keep mouse movements smooth and deliberate
- [ ] Pause briefly after clicking buttons
- [ ] Highlight important numbers and features
- [ ] Stay within 3-minute time limit

### Demo Flow (180 seconds total)

#### Opening (0-20 seconds)
1. Start on dashboard homepage
2. "Welcome to SmileCoin, the blockchain-powered tourist rewards system"
3. "Let me show you how it transforms tourism in Hong Kong"

#### Restaurant Dashboard (20-100 seconds)
1. Navigate to Dashboard tab
2. "Here's Golden Dragon Restaurant's real-time analytics"
3. Point to key metrics: "1,247 smile coins, ranking #8 out of 150"
4. Show daily charts: "Consistent growth over the past week"
5. Display origin breakdown: "Tourists from 7 countries including US, UK, Japan"
6. "This data helps restaurants understand their international appeal"

#### QR Code System (100-140 seconds)
1. Click QR Code Generator tab
2. "Restaurants generate secure QR codes for tourists to scan"
3. Select demo restaurant and generate code
4. "Each code contains the restaurant's blockchain wallet address"
5. Show printable format: "Ready for display in the restaurant"

#### Souvenir System (140-170 seconds)
1. Navigate to Souvenir Progress tab
2. "Tourists who give all daily coins for 7 days earn physical souvenirs"
3. Show completed progress: "This tourist completed the challenge"
4. Display voucher: "They can now collect their commemorative coin"

#### Closing (170-180 seconds)
1. "SmileCoin creates transparency, engagement, and valuable tourism data"
2. "All powered by blockchain technology"
3. "Thank you for watching"

## Post-Recording Processing

### Using the Automated Script
```bash
# Make sure you have your recording files
# screen_recording.mov (your screen recording)
# narration.wav (optional separate audio)

# Run the video production script
./video-production.sh
```

### Manual Processing with ffmpeg
```bash
# If you have separate audio and video
ffmpeg -i screen_recording.mov -i narration.wav -c:v copy -c:a aac demo_combined.mp4

# Create intro slide
ffmpeg -f lavfi -i color=c=0x1f2937:s=1920x1080:d=3 \
  -vf "drawtext=text='SmileCoin Tourist Rewards':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2" \
  intro.mp4

# Create outro slide  
ffmpeg -f lavfi -i color=c=0x1f2937:s=1920x1080:d=3 \
  -vf "drawtext=text='Thank You':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2" \
  outro.mp4

# Combine all parts
echo "file 'intro.mp4'" > files.txt
echo "file 'demo_combined.mp4'" >> files.txt  
echo "file 'outro.mp4'" >> files.txt

ffmpeg -f concat -safe 0 -i files.txt -c copy final_demo.mp4

# Optimize for web
ffmpeg -i final_demo.mp4 -vcodec libx264 -acodec aac -vb 2000k -ab 192k -s 1280x720 demo_web.mp4
```

## Troubleshooting

### Common Issues

**Audio not recording:**
- Check microphone permissions in System Preferences > Security & Privacy
- Select correct audio input in recording software
- Test audio levels before starting

**Screen recording choppy:**
- Close unnecessary applications
- Reduce screen resolution if needed
- Use external drive for recording if disk space is low

**Demo running too long:**
- Practice with timer
- Focus on key features only
- Speak faster but clearly
- Skip detailed explanations

**Web dashboard not loading:**
- Ensure `npm start` completed successfully
- Check http://localhost:3001 in browser
- Restart development server if needed
- Use backup screenshots if necessary

### Quality Tips

**Video Quality:**
- Record at 1920x1080 resolution
- Use 30fps frame rate
- Ensure good lighting on screen
- Keep browser at 100% zoom

**Audio Quality:**
- Use external microphone if available
- Record in quiet environment
- Speak 6 inches from microphone
- Avoid background noise

**Presentation Tips:**
- Smile while speaking (it shows in your voice)
- Use enthusiastic but professional tone
- Emphasize key numbers and benefits
- Keep energy high throughout

## File Organization

After recording, organize files like this:
```
demo-recordings/
├── raw/
│   ├── screen_recording.mov
│   ├── narration.wav
│   └── backup_recording.mov
├── processed/
│   ├── smilecoin_demo_full.mp4
│   ├── smilecoin_demo_web.mp4
│   └── thumbnail.jpg
└── assets/
    ├── intro.mp4
    ├── outro.mp4
    └── slides/
```

## Sharing Your Demo

### Upload Platforms
- **YouTube**: Best for public sharing and SEO
- **Vimeo**: Professional presentation, better quality
- **Google Drive**: Easy sharing with specific people
- **Dropbox**: Good for large files

### Recommended Settings
- **Resolution**: 1280x720 (720p) for web
- **Bitrate**: 2000k video, 192k audio
- **Format**: MP4 with H.264 codec
- **File size**: Target under 100MB for easy sharing

### Demo Links to Include
- Live demo: http://localhost:3001 (for local testing)
- GitHub repository: [Your repo URL]
- Documentation: Links to system docs
- Contact information: Your email/LinkedIn

Remember: The goal is to showcase SmileCoin's innovation and real-world impact in just 3 minutes. Focus on the blockchain transparency, restaurant analytics, and tourist engagement that makes SmileCoin unique!

Good luck with your demo! 🎬✨