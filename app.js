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
  "woda": "Water"
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
