// POI Mapping Dictionary (VeloPlanner/GPX -> Karoo Supported)
const POI_MAPPING = {
  "generic": "Generic",
  "campsite": "Camping",
  "shelter": "Lodging",
  "rest_area": "Generic",
  "summit": "Summit",
  "viewpoint": "Generic",
  "attraction": "Generic",
  "lodging": "Lodging",
  "grocery_store": "Food",
  "store": "Generic",
  "bike_shop": "Generic",
  "fuel_station": "Generic",
  "food": "Food",
  "coffee": "Food",
  "water": "Water",
  "information": "Generic",
  "toilet": "Generic",
  "first_aid": "Generic",
  "alert": "Danger",
  "parking": "Parking",
  "geocache": "Geocache",
  "danger": "Danger",
  "warning": "Danger",
  "bakery": "Food",
  "café": "Food",
  "cafe": "Food",
  "cemetery (drinking water)": "Water",
  "convenience store": "Food",
  "drinking water": "Water",
  "drinking_water": "Water",
  "fast food": "Food",
  "fountain": "Water",
  "gas station": "Generic",
  "ice cream parlor": "Food",
  "kiosk": "Generic",
  "other": "Generic",
  "restaurant": "Food",
  "spring": "Water",
  "supermarket": "Food",
  "toilets": "Generic",
  "vending machine": "Food",
  "water intake point": "Water",
  "water point": "Water",
  "woda": "Water",

  // Additional types (Komoot, RideWithGPS, etc.)
  "aid station": "Food",
  "art": "Generic",
  "beach": "Generic",
  "bike shop": "Generic",
  "bridge": "Generic",
  "checkpoint": "Generic",
  "crossing": "Generic",
  "first aid": "Generic",
  "gear": "Generic",
  "info": "Generic",
  "meeting point": "Generic",
  "obstacle": "Danger",
  "park": "Generic",
  "pub": "Food",
  "rest area": "Generic",
  "segment end": "Generic",
  "segment start": "Generic",
  "service": "Generic",
  "sharp curve": "Danger",
  "shower": "Water",
  "steep incline": "Danger",
  "transition": "Generic",
  "transport": "Generic",
  "tunnel": "Generic",
  "valley": "Generic"
};

// POI type colors for map visualization
const POI_COLORS = {
  "Food": "#ff9800",
  "Water": "#29b6f6",
  "Parking": "#78909c",
  "Camping": "#66bb6a",
  "Lodging": "#ab47bc",
  "Geocache": "#fdd835",
  "Summit": "#ef5350",
  "Generic": "#90a4ae",
  "Danger": "#ff1744"
};

// State Variables
let originalFileName = "";
let processedGpxContent = "";

// DOM Elements
const uploadZone = document.getElementById("upload-zone");
const fileInput = document.getElementById("file-input");
const resultsCard = document.getElementById("results-card");
const totalWptsElem = document.getElementById("total-wpts");
const mappedWptsElem = document.getElementById("mapped-wpts");
const typeListElem = document.getElementById("type-list");
const downloadBtn = document.getElementById("download-btn");
const resetBtn = document.getElementById("reset-btn");
const installBtn = document.getElementById("install-btn");

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(reg => console.log("Service Worker registered!", reg))
      .catch(err => console.error("Service Worker registration failed:", err));
  });
}

// Installation Prompt Logic
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
});

installBtn.addEventListener("click", () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      deferredPrompt = null;
      installBtn.style.display = "none";
    });
  }
});

// Drag and drop event listeners
uploadZone.addEventListener("click", () => fileInput.click());
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});
uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("dragover");
});
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// File processing handler
function handleFile(file) {
  if (!file.name.endsWith(".gpx")) {
    alert("Please select a valid GPX file.");
    return;
  }

  originalFileName = file.name;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      processGpx(e.target.result);
    } catch (err) {
      console.error(err);
      alert("Error parsing GPX file. Make sure it is valid XML.");
    }
  };

  reader.readAsText(file);
}

// Core GPX Processing Logic
function processGpx(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "text/xml");

  // Check for XML parsing errors
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("Invalid XML content");
  }

  const wpts = xmlDoc.getElementsByTagName("wpt");
  let totalWpts = wpts.length;
  let mappedWpts = 0;
  const typeCounts = {};

  for (let i = 0; i < wpts.length; i++) {
    const wpt = wpts[i];
    let typeNode = wpt.getElementsByTagName("type")[0];

    if (typeNode) {
      const originalType = typeNode.textContent.trim();
      const normalizedType = originalType.toLowerCase();
      const mappedType = POI_MAPPING[normalizedType] || "Generic";

      // If type changed, preserve original type in <name> and <desc>
      if (originalType.toLowerCase() !== mappedType.toLowerCase()) {
        const suffix = ` (${originalType})`;
        const nameNode = wpt.getElementsByTagName("name")[0];
        if (nameNode) nameNode.textContent = nameNode.textContent.trim() + suffix;
        const descNode = wpt.getElementsByTagName("desc")[0];
        if (descNode) descNode.textContent = descNode.textContent.trim() + suffix;
      }

      // Update <type>
      typeNode.textContent = mappedType;
      mappedWpts++;

      // Update or create <sym>
      let symNode = wpt.getElementsByTagName("sym")[0];
      if (symNode) {
        symNode.textContent = mappedType;
      } else {
        symNode = xmlDoc.createElementNS(wpt.namespaceURI || "http://www.topografix.com/GPX/1/1", "sym");
        symNode.textContent = mappedType;
        // Insert symNode next to typeNode
        typeNode.parentNode.insertBefore(symNode, typeNode.nextSibling);
      }

      // Track counts
      typeCounts[mappedType] = (typeCounts[mappedType] || 0) + 1;
    } else {
      // If no type tag, we treat it as Generic and add type/sym tags
      typeNode = xmlDoc.createElementNS(wpt.namespaceURI || "http://www.topografix.com/GPX/1/1", "type");
      typeNode.textContent = "Generic";
      
      let symNode = xmlDoc.createElementNS(wpt.namespaceURI || "http://www.topografix.com/GPX/1/1", "sym");
      symNode.textContent = "Generic";

      wpt.appendChild(typeNode);
      wpt.appendChild(symNode);

      mappedWpts++;
      typeCounts["Generic"] = (typeCounts["Generic"] || 0) + 1;
    }
  }

  // Serialize updated XML back to string
  const serializer = new XMLSerializer();
  processedGpxContent = serializer.serializeToString(xmlDoc);

  // Update UI Elements
  displayResults(totalWpts, mappedWpts, typeCounts);

  // Draw route & POI visualization after DOM reflow
  requestAnimationFrame(() => drawVisualization(xmlDoc));
}

function displayResults(total, mapped, counts) {
  totalWptsElem.textContent = total;
  mappedWptsElem.textContent = mapped;

  // Clear type list
  typeListElem.innerHTML = "";

  // Populate type list
  Object.keys(counts).sort().forEach(type => {
    const li = document.createElement("div");
    li.className = "type-item";
    li.innerHTML = `
      <span class="type-name">
        <span class="type-dot"></span>
        ${type}
      </span>
      <span class="type-count">${counts[type]}</span>
    `;
    typeListElem.appendChild(li);
  });

  // Toggle Card visibility
  uploadZone.style.display = "none";
  resultsCard.style.display = "block";
}

// Route & POI canvas visualization (offline, no map tiles needed)
function drawVisualization(xmlDoc) {
  const canvas = document.getElementById("map-canvas");
  const preview = document.getElementById("map-preview");
  if (!canvas || !preview) return;

  // Collect track/route points
  const track = [];
  for (const tag of ["trkpt", "rtept"]) {
    const els = xmlDoc.getElementsByTagName(tag);
    for (let i = 0; i < els.length; i++) {
      track.push({
        lat: parseFloat(els[i].getAttribute("lat")),
        lon: parseFloat(els[i].getAttribute("lon"))
      });
    }
  }

  // Collect mapped waypoints
  const pois = [];
  const wpts = xmlDoc.getElementsByTagName("wpt");
  for (let i = 0; i < wpts.length; i++) {
    const w = wpts[i];
    const nameEl = w.getElementsByTagName("name")[0];
    const typeEl = w.getElementsByTagName("type")[0];
    pois.push({
      lat: parseFloat(w.getAttribute("lat")),
      lon: parseFloat(w.getAttribute("lon")),
      name: nameEl ? nameEl.textContent.trim() : "",
      type: typeEl ? typeEl.textContent.trim() : "Generic"
    });
  }

  const all = [...track, ...pois];
  if (all.length === 0) { preview.style.display = "none"; return; }
  preview.style.display = "block";

  // Bounding box with padding
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  all.forEach(p => {
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon); maxLon = Math.max(maxLon, p.lon);
  });
  const bPad = 0.15;
  const rawLatR = (maxLat - minLat) || 0.005;
  const rawLonR = (maxLon - minLon) || 0.005;
  minLat -= rawLatR * bPad; maxLat += rawLatR * bPad;
  minLon -= rawLonR * bPad; maxLon += rawLonR * bPad;
  const latR = maxLat - minLat;
  const lonR = maxLon - minLon;

  // Canvas sizing with Mercator latitude correction
  const dpr = window.devicePixelRatio || 1;
  const cssW = preview.clientWidth;
  const cosLat = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const cssH = Math.min(Math.max(Math.round(cssW * (latR / (lonR * cosLat))), 180), 400);

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Coordinate projection (lon→X, lat→Y inverted for screen)
  const mg = 35;
  const dW = cssW - 2 * mg, dH = cssH - 2 * mg;
  const toX = lon => mg + ((lon - minLon) / lonR) * dW;
  const toY = lat => mg + ((maxLat - lat) / latR) * dH;

  ctx.clearRect(0, 0, cssW, cssH);

  // Draw route line
  if (track.length > 1) {
    ctx.beginPath();
    ctx.moveTo(toX(track[0].lon), toY(track[0].lat));
    for (let i = 1; i < track.length; i++) {
      ctx.lineTo(toX(track[i].lon), toY(track[i].lat));
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw POI markers with labels
  ctx.font = "500 10px Inter, sans-serif";
  ctx.textBaseline = "middle";

  pois.forEach(p => {
    const x = toX(p.lon), y = toY(p.lat);
    const col = POI_COLORS[p.type] || POI_COLORS["Generic"];

    // Glow ring
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = col + "35";
    ctx.fill();

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();

    // Label
    let label = p.name || p.type;
    if (label.length > 22) label = label.slice(0, 20) + "\u2026";
    const tw = ctx.measureText(label).width;
    const lx = (x > cssW * 0.55) ? x - tw - 12 : x + 10;

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(lx - 3, y - 7, tw + 6, 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "left";
    ctx.fillText(label, lx, y);
  });
}

// Download action
downloadBtn.addEventListener("click", () => {
  if (!processedGpxContent) return;

  const blob = new Blob([processedGpxContent], { type: "application/gpx+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Format target file name
  const targetName = originalFileName.startsWith("KAROO_") ? originalFileName : `KAROO_${originalFileName}`;
  
  link.href = url;
  link.download = targetName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// Reset view action
resetBtn.addEventListener("click", () => {
  fileInput.value = "";
  processedGpxContent = "";
  originalFileName = "";
  resultsCard.style.display = "none";
  uploadZone.style.display = "flex";
});
