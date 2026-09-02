// Color options for palette
const colors = [
  "#FF0000", "#FF4500", "#FFA500", "#FFD700", "#FFFF00", "#9ACD32",
  "#008000", "#00FF7F", "#00FFFF", "#1E90FF", "#0000FF", "#8A2BE2",
  "#4B0082", "#FF00FF", "#FF1493", "#FFC0CB", "#A52A2A", "#D3D3D3",
  "#808080", "#000000", "#FFFFFF"
];

// State variables
let selectedColor = colors[0];
let isMouseDown = false;

// DOM Elements
const paletteGrid = document.getElementById("palette-grid");
const canvasGrid = document.getElementById("canvas-grid");
const clearBtn = document.getElementById("clear-btn");

// 1. Build Color Palette
colors.forEach((color, index) => {
  const colorBox = document.createElement("div");
  colorBox.classList.add("color-box");
  colorBox.style.backgroundColor = color;

  if (index === 0) colorBox.classList.add("selected");

  colorBox.addEventListener("click", () => {
    document.querySelectorAll(".color-box").forEach(box => box.classList.remove("selected"));
    colorBox.classList.add("selected");
    selectedColor = color;
  });

  paletteGrid.appendChild(colorBox);
});

// 2. Build Canvas Grid (60 columns x 40 rows = 2400 pixels)
const totalPixels = 60 * 40;

for (let i = 0; i < totalPixels; i++) {
  const pixel = document.createElement("div");
  pixel.classList.add("pixel");

  // Single click drawing
  pixel.addEventListener("mousedown", () => {
    pixel.style.backgroundColor = selectedColor;
  });

  // Click & drag drawing
  pixel.addEventListener("mouseover", () => {
    if (isMouseDown) {
      pixel.style.backgroundColor = selectedColor;
    }
  });

  canvasGrid.appendChild(pixel);
}

// 3. Track Global Mouse Down / Up States for Dragging
document.body.addEventListener("mousedown", () => {
  isMouseDown = true;
});

document.body.addEventListener("mouseup", () => {
  isMouseDown = false;
});

// 4. Clear Button Functionality
clearBtn.addEventListener("click", () => {
  const pixels = document.querySelectorAll(".pixel");
  pixels.forEach(pixel => {
    pixel.style.backgroundColor = "#ffffff";
  });
});