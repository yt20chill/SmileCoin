#!/bin/bash

# SmileCoin Demo Video Production Script
# Requires: ffmpeg, screen recording, audio file

echo "🎬 Starting SmileCoin demo video production..."

# Create intro slide (3 seconds)
ffmpeg -f lavfi -i color=c=0x1f2937:s=1920x1080:d=3 -vf "drawtext=text='SmileCoin Tourist Rewards System':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-50,drawtext=text='Blockchain-Powered Tourism Innovation':fontcolor=0xf59e0b:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+50" -y intro.mp4

# Create outro slide (3 seconds)  
ffmpeg -f lavfi -i color=c=0x1f2937:s=1920x1080:d=3 -vf "drawtext=text='Thank You':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-100,drawtext=text='SmileCoin - Transforming Tourism':fontcolor=0xf59e0b:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2,drawtext=text='github.com/smilecoin-hk':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+100" -y outro.mp4

# Combine screen recording with audio (replace with your files)
if [ -f "screen_recording.mov" ] && [ -f "narration.wav" ]; then
    ffmpeg -i screen_recording.mov -i narration.wav -c:v libx264 -c:a aac -strict experimental -y demo_main.mp4
    echo "✅ Combined screen recording with audio"
else
    echo "⚠️  Please provide screen_recording.mov and narration.wav files"
fi

# Create file list for concatenation
cat > file_list.txt << EOF
file 'intro.mp4'
file 'demo_main.mp4'  
file 'outro.mp4'
EOF

# Concatenate all parts
if [ -f "demo_main.mp4" ]; then
    ffmpeg -f concat -safe 0 -i file_list.txt -c copy -y smilecoin_demo_full.mp4
    echo "✅ Created full demo video: smilecoin_demo_full.mp4"
fi

# Create optimized version for web
if [ -f "smilecoin_demo_full.mp4" ]; then
    ffmpeg -i smilecoin_demo_full.mp4 -vcodec libx264 -acodec aac -vb 2000k -ab 192k -s 1280x720 -y smilecoin_demo_web.mp4
    echo "✅ Created web-optimized version: smilecoin_demo_web.mp4"
fi

# Create thumbnail
if [ -f "smilecoin_demo_full.mp4" ]; then
    ffmpeg -i smilecoin_demo_full.mp4 -ss 00:00:30 -vframes 1 -y thumbnail.jpg
    echo "✅ Created thumbnail: thumbnail.jpg"
fi

echo "🎉 Video production complete!"
echo "📁 Files created:"
echo "   - smilecoin_demo_full.mp4 (full quality)"
echo "   - smilecoin_demo_web.mp4 (web optimized)"
echo "   - thumbnail.jpg (video thumbnail)"

# Clean up temporary files
rm -f intro.mp4 outro.mp4 file_list.txt

echo "🧹 Cleaned up temporary files"
