import { Restaurant } from '../types/restaurant';

// Helper to wrap text on canvas
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

// Draw a rounded rect helper
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export const renderShareCardToCanvas = (
  canvas: HTMLCanvasElement,
  restaurant: Restaurant
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set size
  canvas.width = 800;
  canvas.height = 800;

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 800);
  grad.addColorStop(0, '#0f172a'); // slate-900
  grad.addColorStop(0.5, '#022c22'); // emerald-950
  grad.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 800);

  // Decorative soft glow circles
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'; // transparent blue
  ctx.beginPath();
  ctx.arc(100, 100, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // transparent emerald
  ctx.beginPath();
  ctx.arc(700, 700, 250, 0, Math.PI * 2);
  ctx.fill();

  // Draw card border frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 16;
  drawRoundedRect(ctx, 30, 30, 740, 740, 40);
  ctx.stroke();

  // 2. Header Branding
  // Logo Circle
  const logoGrad = ctx.createLinearGradient(350, 100, 450, 100);
  logoGrad.addColorStop(0, '#3b82f6'); // blue-500
  logoGrad.addColorStop(1, '#10b981'); // emerald-500
  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  ctx.arc(400, 110, 35, 0, Math.PI * 2);
  ctx.fill();

  // Draw small fork/knife simple path on the logo
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  // Fork lines
  ctx.beginPath();
  ctx.moveTo(390, 95);
  ctx.lineTo(390, 110);
  ctx.moveTo(385, 95);
  ctx.lineTo(385, 105);
  ctx.moveTo(395, 95);
  ctx.lineTo(395, 105);
  // Fork base
  ctx.moveTo(385, 105);
  ctx.lineTo(395, 105);
  ctx.moveTo(390, 105);
  ctx.lineTo(390, 125);
  // Knife
  ctx.moveTo(410, 95);
  ctx.lineTo(410, 125);
  ctx.stroke();

  // Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUNCH HUB', 400, 185);

  // Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('THE PERFECT MEAL DECISION', 400, 210);

  // 3. Central Banner/Badge ("THE DECISION IS IN")
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  drawRoundedRect(ctx, 280, 240, 240, 44, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text inside badge
  ctx.fillStyle = '#60a5fa'; // blue-400
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('🎲 LUNCH DECIDED 🎲', 400, 267);

  // 4. Restaurant Main Content Card (Inner Glass Box)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  drawRoundedRect(ctx, 80, 310, 640, 340, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  // Restaurant Name (Dynamic font sizing depending on length)
  const restName = restaurant.name;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  let fontSize = 42;
  if (restName.length > 25) fontSize = 34;
  if (restName.length > 40) fontSize = 28;
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

  const afterNameY = wrapText(ctx, restName.toUpperCase(), 400, 385, 560, fontSize + 8);

  // Cuisine/Type Tag
  const cuisine = restaurant.cuisine || restaurant.amenity || 'Restaurant';
  const displayCuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
  
  // Measure text to size the badge
  ctx.font = '600 15px system-ui, -apple-system, sans-serif';
  const badgeTextWidth = ctx.measureText(displayCuisine).width;
  const badgeW = badgeTextWidth + 32;
  const badgeH = 34;
  const badgeX = 400 - badgeW / 2;
  const badgeY = afterNameY + 10;

  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // light green tint
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#34d399'; // emerald-400
  ctx.fillText(displayCuisine, 400, badgeY + 22);

  // Address Details
  const address = restaurant.address || 'Location Details Available in App';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '400 16px system-ui, -apple-system, sans-serif';
  wrapText(ctx, address, 400, badgeY + badgeH + 45, 500, 24);

  // 5. Card Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('VISIT THELUNCHUB.COM TO FIND YOUR NEXT MEAL', 400, 715);
};

export const generateShareCardBlob = async (restaurant: Restaurant): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  renderShareCardToCanvas(canvas, restaurant);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate Canvas blob'));
      }
    }, 'image/png');
  });
};

export const shareRestaurantCard = async (restaurant: Restaurant): Promise<boolean> => {
  try {
    const blob = await generateShareCardBlob(restaurant);
    const file = new File([blob], `${restaurant.name.replace(/\s+/g, '-').toLowerCase()}-card.png`, {
      type: 'image/png',
    });

    const shareData = {
      files: [file],
      title: 'Lunch Decision',
      text: `We are going to ${restaurant.name} for lunch! Decided by Lunch Hub.`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing image card:', error);
    return false;
  }
};

export const downloadRestaurantCard = (restaurant: Restaurant): void => {
  const canvas = document.createElement('canvas');
  renderShareCardToCanvas(canvas, restaurant);
  const dataUrl = canvas.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.download = `${restaurant.name.replace(/\s+/g, '-').toLowerCase()}-lunchhub-card.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
