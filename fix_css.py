import re

with open(r'c:\Users\22061\Desktop\西方塔罗\css\styles.css', 'rb') as f:
    data = f.read()

# Find where the null bytes start (UTF-16 corruption)
null_idx = data.find(b'\x00')
if null_idx > 0:
    print(f"Found corrupted data starting at byte {null_idx} out of {len(data)}")
    # Keep only the clean part
    clean = data[:null_idx]
    
    # Append proper UTF-8 flip CSS
    flip_css = """
/* 3D Flip Card Styles */
.flip-container {
  perspective: 1000px;
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.flipper {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
}

.flip-front, .flip-back {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  backface-visibility: hidden;
  border-radius: 8px;
  overflow: hidden;
}

.flip-back {
  transform: rotateY(0deg);
}

.flip-front {
  transform: rotateY(180deg);
}

.flipper.flipped {
  transform: rotateY(180deg);
}
"""
    clean += flip_css.encode('utf-8')
    
    with open(r'c:\Users\22061\Desktop\西方塔罗\css\styles.css', 'wb') as f:
        f.write(clean)
    print("Fixed! Removed corrupted bytes and wrote clean flip CSS.")
else:
    print("No corruption found.")
