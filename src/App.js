import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const LIFE_EXPECTANCY_YEARS = 90;
const WEEKS_PER_YEAR = 52;
const TOTAL_WEEKS = LIFE_EXPECTANCY_YEARS * WEEKS_PER_YEAR;

const TIME_WARNINGS = [
  "时间不会等待任何人",
  "每一个瞬间都是珍贵的礼物",
  "时间是最公平的资源",
  "把握当下，珍惜眼前",
  "时间一去不复返"
];

function App() {
  const [birthDate, setBirthDate] = useState('2000-01-01');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [livedWeeks, setLivedWeeks] = useState(0);
  const [currentWarning, setCurrentWarning] = useState(TIME_WARNINGS[0]);
  const [gridDimensions, setGridDimensions] = useState({ columns: 78, rows: 60 });
  const blocksRef = useRef(null);

  // Calculate lived weeks based on birth date
  const calculateLivedWeeks = (birth) => {
    const now = new Date();
    const birthDate = new Date(birth);
    const diffTime = Math.abs(now - birthDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  };

  useEffect(() => {
    const weeks = calculateLivedWeeks(birthDate);
    setLivedWeeks(weeks);
  }, [birthDate]);

  const updateGridDimensions = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = window.innerWidth <= 767;

    if (isPortrait || isMobile) {
      setGridDimensions({ columns: 26, rows: 180 });
    } else {
      setGridDimensions({ columns: 78, rows: 60 });
    }
  };

  useEffect(() => {
    updateGridDimensions();
    window.addEventListener('resize', updateGridDimensions);
    return () => window.removeEventListener('resize', updateGridDimensions);
  }, []);

  useEffect(() => {
    const randomWarning = TIME_WARNINGS[Math.floor(Math.random() * TIME_WARNINGS.length)];
    setCurrentWarning(randomWarning);
  }, []);

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkTheme]);

  const renderBlocks = () => {
    const blocks = [];
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(birthDate).getFullYear();
    const age = currentYear - birthYear;

    // Calculate current week index
    const startOfYear = new Date(currentYear, 0, 1);
    const today = new Date();
    const currentWeekOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24 * 7));
    const currentWeekIndex = (age * WEEKS_PER_YEAR) + currentWeekOfYear;

    for (let i = 0; i < TOTAL_WEEKS; i++) {
      const yearIndex = Math.floor(i / WEEKS_PER_YEAR);
      const weekIndex = i % WEEKS_PER_YEAR;

      // Determine if this is the current week
      const isCurrentWeek = (yearIndex === age) && (weekIndex === currentWeekOfYear);

      // Lived weeks are those before the current week
      const isLived = i < currentWeekIndex;

      blocks.push(
        <div
          key={i}
          className={`block ${isLived ? 'lived' : 'remaining'} ${isCurrentWeek ? 'current-week' : ''}`}
        />
      );
    }
    return blocks;
  };

  const exportBlocks = async (format) => {
    if (!blocksRef.current) return;

    const canvas = await html2canvas(blocksRef.current, {
      backgroundColor: isDarkTheme ? '#1a1a1a' : '#ffffff',
      scale: 4,
      useCORS: true,
      allowTaint: true,
      width: blocksRef.current.offsetWidth,
      height: blocksRef.current.offsetHeight
    });

    // Create final canvas with proper aspect ratio and warning text
    let finalWidth, finalHeight;

    switch (format) {
      case 'pc':
        finalWidth = 3840; // 4K width
        finalHeight = 2160; // 4K height (16:9)
        break;
      case 'mobile':
        finalWidth = 1440; // Mobile width
        finalHeight = 3200; // Mobile height (9:16)
        break;
      case 'social':
        finalWidth = 1200; // Square for social media
        finalHeight = 1200;
        break;
      default:
        finalWidth = canvas.width;
        finalHeight = canvas.height;
    }

    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;

    // Fill background
    ctx.fillStyle = isDarkTheme ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Use smaller padding (5% of width/height instead of 60px)
    const paddingX = finalWidth * 0.05;
    const paddingY = finalHeight * 0.05;
    const textHeight = 60; // Space for warning text

    // Calculate scale to maximize block size (fill 90% of available space)
    const availableWidth = finalWidth - (paddingX * 2);
    const availableHeight = finalHeight - (paddingY * 2) - textHeight;
    const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height) * 0.95; // Use 95% to add small margin

    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const x = (finalWidth - scaledWidth) / 2;
    const y = (finalHeight - scaledHeight - textHeight) / 2;

    // Draw blocks (they will now fill ~85-90% of the available space)
    ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

    // Add warning text at bottom with smaller font
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isDarkTheme ? '#888' : '#666';
    ctx.textAlign = 'center';
    ctx.fillText(currentWarning, finalWidth / 2, finalHeight - paddingY / 2);

    // Download
    const link = document.createElement('a');
    link.download = `life-blocks-${format}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
  };

  const shareBlocks = async () => {
    if (!blocksRef.current) return;

    const canvas = await html2canvas(blocksRef.current, {
      backgroundColor: isDarkTheme ? '#1a1a1a' : '#ffffff',
      scale: 3,
      useCORS: true,
      allowTaint: true,
      width: blocksRef.current.offsetWidth,
      height: blocksRef.current.offsetHeight
    });

    // Create canvas with warning text - use larger size for better quality
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');

    // Use a good sharing size (square format works best for most platforms)
    const finalSize = 1200;
    const padding = finalSize * 0.06; // 6% padding
    const textHeight = 40;

    finalCanvas.width = finalSize;
    finalCanvas.height = finalSize;

    // Fill background
    ctx.fillStyle = isDarkTheme ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Calculate scale to maximize block size
    const availableSize = finalSize - (padding * 2) - textHeight;
    const scale = Math.min(availableSize / canvas.width, availableSize / canvas.height) * 0.98;

    const scaledSize = canvas.width * scale;
    const x = (finalCanvas.width - scaledSize) / 2;
    const y = (finalCanvas.height - scaledSize - textHeight) / 2;

    // Draw blocks
    ctx.drawImage(canvas, x, y, scaledSize, scaledSize);

    // Add warning text
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isDarkTheme ? '#888' : '#666';
    ctx.textAlign = 'center';
    ctx.fillText(currentWarning, finalCanvas.width / 2, finalCanvas.height - padding / 2);

    // Convert to blob and share
    finalCanvas.toBlob((blob) => {
      if (navigator.share) {
        const file = new File([blob], 'life-blocks.png', { type: 'image/png' });
        navigator.share({
          title: '生命周数',
          text: currentWarning,
          files: [file]
        });
      } else {
        // Fallback download
        const link = document.createElement('a');
        link.download = 'life-blocks.png';
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    });
  };

  return (
    <div className={`app ${isDarkTheme ? 'dark' : ''}`}>
      <div className="header-bar">
        <div className="birth-date-input">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="warning-text">
          {currentWarning}
        </div>
        <button
          className="theme-toggle-small"
          onClick={() => setIsDarkTheme(!isDarkTheme)}
        >
          {isDarkTheme ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="blocks-container" ref={blocksRef}>
        <div
          className="blocks-grid"
          style={{
            gridTemplateColumns: `repeat(${gridDimensions.columns}, 1fr)`,
            gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`
          }}
        >
          {renderBlocks()}
        </div>
      </div>

      <div className="action-bar">
        <button className="action-button-small" onClick={shareBlocks}>
          分享
        </button>
        <div className="export-buttons">
          <button className="export-button-small" onClick={() => exportBlocks('pc')}>
            PC
          </button>
          <button className="export-button-small" onClick={() => exportBlocks('mobile')}>
            手机
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;