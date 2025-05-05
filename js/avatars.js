// This script generates placeholder avatars using canvas
// Run this once when the page loads to create the avatar images

document.addEventListener("DOMContentLoaded", () => {
  // Colors for the avatars
  const colors = [
    "#3498db", // blue
    "#2ecc71", // green
    "#e74c3c", // red
    "#f39c12", // orange
  ];

  // Create avatar canvases
  for (let i = 1; i <= 4; i++) {
    createAvatar(i, colors[i - 1]);
  }
});

/**
 * Create an avatar with the given index and color
 * @param {number} index - The avatar index (1-4)
 * @param {string} color - The background color for the avatar
 */
function createAvatar(index, color) {
  // Find all avatar images with this index
  const avatarImages = document.querySelectorAll(
    `img[data-avatar="avatar${index}.png"]`
  );

  // Create a canvas element
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");

  // Draw background circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();

  // Draw a pattern or initials based on the index
  ctx.fillStyle = "white";
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw a different pattern for each avatar
  switch (index) {
    case 1:
      // First avatar - Letter A
      ctx.fillText("A", 100, 100);
      break;
    case 2:
      // Second avatar - Letter B
      ctx.fillText("B", 100, 100);
      break;
    case 3:
      // Third avatar - Letter C
      ctx.fillText("C", 100, 100);
      break;
    case 4:
      // Fourth avatar - Letter D
      ctx.fillText("D", 100, 100);
      break;
  }

  // Convert the canvas to a data URL and set it as the src for all matching images
  const dataURL = canvas.toDataURL("image/png");
  avatarImages.forEach((img) => {
    img.src = dataURL;
  });
}
