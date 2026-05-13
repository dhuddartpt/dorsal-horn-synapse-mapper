const baseZones = {
  skin: {
    label: "Inflammatory sensitizers at the skin nociceptor terminal",
    completeText: "Peripheral inflammatory mediators sensitize nociceptor endings before the signal reaches the cord.",
  },
  primarySynapse: {
    label: "Primary afferent to second-order projection neuron",
    completeText: "Primary afferents release glutamate for fast excitation and substance P with stronger or sustained input.",
  },
  presynapticInhibition: {
    label: "Interneuron onto first-order afferent terminal",
    completeText: "GABAergic axo-axonic inhibition reduces transmitter release from the nociceptor central terminal.",
  },
  postsynapticInhibition: {
    label: "Interneuron onto projection neuron",
    completeText: "Spinal inhibitory interneurons reduce projection neuron excitability through fast inhibition and opioid modulation.",
  },
  descending: {
    label: "Descending RVM and LC modulation",
    completeText: "RVM 5-HT pathways can inhibit or facilitate; LC norepinephrine is classically inhibitory in the dorsal horn.",
  },
};

const defaultTokens = [
  {
    id: "histamine",
    text: "Histamine",
    kind: "peripheral",
    targetZone: "skin",
    feedback: "Correct: histamine from peripheral inflammatory cells can sensitize nociceptor endings in skin.",
  },
  {
    id: "cytokines",
    text: "Cytokines",
    kind: "peripheral",
    targetZone: "skin",
    feedback: "Correct: inflammatory cytokines act around injured tissue and can amplify nociceptor responsiveness.",
  },
  {
    id: "prostaglandins",
    text: "Prostaglandins",
    kind: "peripheral",
    targetZone: "skin",
    feedback: "Correct: prostaglandins are classic peripheral sensitizers at nociceptor terminals.",
  },
  {
    id: "glutamate",
    text: "Glutamate",
    kind: "excitatory",
    targetZone: "primarySynapse",
    feedback: "Correct: glutamate is the main fast excitatory transmitter released by primary nociceptive afferents.",
  },
  {
    id: "substance-p",
    text: "Substance P",
    kind: "excitatory",
    targetZone: "primarySynapse",
    feedback: "Correct: substance P is released by nociceptive afferents, especially with intense or sustained input.",
  },
  {
    id: "gaba",
    text: "GABA, presynaptic",
    kind: "inhibitory",
    targetZone: "presynapticInhibition",
    feedback: "Correct: GABA can inhibit transmitter release from the primary afferent terminal.",
  },
  {
    id: "gaba-post",
    text: "GABA, postsynaptic",
    kind: "inhibitory",
    targetZone: "postsynapticInhibition",
    feedback: "Correct: GABA also inhibits dorsal horn neurons postsynaptically.",
  },
  {
    id: "glycine",
    text: "Glycine",
    kind: "inhibitory",
    targetZone: "postsynapticInhibition",
    feedback: "Correct: glycine is a fast inhibitory transmitter in spinal cord circuits.",
  },
  {
    id: "enkephalin",
    text: "Enkephalin",
    kind: "inhibitory",
    targetZone: "postsynapticInhibition",
    feedback: "Correct: enkephalin is an endogenous opioid that dampens nociceptive transmission in dorsal horn circuits.",
  },
  {
    id: "serotonin",
    text: "Serotonin, RVM",
    kind: "descending",
    targetZone: "descending",
    feedback: "Correct: RVM serotonergic descending input can inhibit or facilitate spinal nociceptive processing.",
  },
  {
    id: "norepinephrine",
    text: "Norepinephrine, LC",
    kind: "descending",
    targetZone: "descending",
    feedback: "Correct: LC noradrenergic input commonly inhibits dorsal horn pain transmission through alpha-2 effects.",
  },
];

const tokenTray = document.querySelector("#tokenTray");
const feedback = document.querySelector("#feedback");
const scoreEl = document.querySelector("#score");
const totalEl = document.querySelector("#total");
const resetBtn = document.querySelector("#resetBtn");
const reviewBtn = document.querySelector("#reviewBtn");
const editModeBtn = document.querySelector("#editModeBtn");
const layoutEditor = document.querySelector("#layoutEditor");
const saveLayoutBtn = document.querySelector("#saveLayoutBtn");
const resetLayoutBtn = document.querySelector("#resetLayoutBtn");
const exportLayoutBtn = document.querySelector("#exportLayoutBtn");
const importLayoutBtn = document.querySelector("#importLayoutBtn");
const layoutJson = document.querySelector("#layoutJson");
const addItemBtn = document.querySelector("#addItemBtn");
const saveItemsBtn = document.querySelector("#saveItemsBtn");
const resetItemsBtn = document.querySelector("#resetItemsBtn");
const answerKeyEditor = document.querySelector("#answerKeyEditor");
const diagramMap = document.querySelector(".diagram-map");
const dropZones = [...document.querySelectorAll(".drop-zone")];

const placed = new Set();
const layoutStorageKey = "dorsalHornSynapseMapper.layout.v1";
const itemStorageKey = "dorsalHornSynapseMapper.items.v1";
let tokens = loadStoredTokens();
let zones = buildZones(tokens);
let zonePlacements = createZonePlacements();
const defaultLayout = {
  skin: { left: 1.8, top: 39, width: 19, height: 92 },
  primarySynapse: { left: 50, top: 67, width: 19, height: 96 },
  presynapticInhibition: { left: 44, top: 54, width: 18, height: 92 },
  postsynapticInhibition: { left: 66, top: 70, width: 20, height: 104 },
  descending: { left: 72, top: 44, width: 22, height: 104 },
};
let currentLayout = loadStoredLayout();
let editMode = false;

function buildZones(tokenList) {
  const rebuilt = {};
  Object.entries(baseZones).forEach(([zoneName, zone]) => {
    rebuilt[zoneName] = { ...zone, accepts: [] };
  });
  tokenList.forEach((token) => {
    if (rebuilt[token.targetZone]) {
      rebuilt[token.targetZone].accepts.push(token.id);
    }
  });
  return rebuilt;
}

function createZonePlacements() {
  return Object.fromEntries(Object.keys(baseZones).map((zone) => [zone, []]));
}

function loadStoredTokens() {
  try {
    const stored = window.localStorage.getItem(itemStorageKey);
    if (!stored) {
      return structuredClone(defaultTokens);
    }
    return normalizeTokens(JSON.parse(stored));
  } catch {
    return structuredClone(defaultTokens);
  }
}

function normalizeTokens(tokenList) {
  if (!Array.isArray(tokenList) || tokenList.length === 0) {
    return structuredClone(defaultTokens);
  }

  const usedIds = new Set();
  return tokenList.map((token, index) => {
    const text = String(token.text || `Item ${index + 1}`).trim();
    const baseId = makeTokenId(token.id || text);
    let id = baseId;
    let counter = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter += 1;
    }
    usedIds.add(id);

    const targetZone = baseZones[token.targetZone] ? token.targetZone : "primarySynapse";
    const kind = ["peripheral", "excitatory", "inhibitory", "descending"].includes(token.kind) ? token.kind : "excitatory";

    return {
      id,
      text,
      kind,
      targetZone,
      feedback: String(token.feedback || `Correct: ${text} belongs at this site.`).trim(),
    };
  });
}

function makeTokenId(value) {
  const id = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return id || `item-${Date.now()}`;
}

function buildTokens() {
  tokenTray.innerHTML = "";
  tokens.forEach((token) => {
    const button = document.createElement("button");
    button.className = "token";
    button.type = "button";
    button.draggable = true;
    button.dataset.id = token.id;
    button.dataset.kind = token.kind;
    button.textContent = token.text;
    button.addEventListener("dragstart", handleDragStart);
    button.addEventListener("click", () => {
      feedback.className = "feedback";
      feedback.textContent = `Selected ${token.text}. Drag it onto the matching anatomical site.`;
    });
    tokenTray.appendChild(button);
  });
}

function handleDragStart(event) {
  if (editMode) {
    event.preventDefault();
    return;
  }
  const id = event.currentTarget.dataset.id;
  if (placed.has(id)) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.setData("text/plain", id);
  event.dataTransfer.effectAllowed = "move";
}

function setFeedback(message, isCorrect) {
  feedback.className = `feedback ${isCorrect ? "good" : "bad"}`;
  feedback.textContent = message;
}

function updateScore() {
  const total = tokens.length;
  scoreEl.textContent = placed.size;
  totalEl.textContent = total;
}

function resetGameState(message = "Drag a card onto a synapse or modulation site.") {
  placed.clear();
  zonePlacements = createZonePlacements();
  dropZones.forEach((zoneElement) => {
    [...zoneElement.querySelectorAll(".placed-chip")].forEach((chip) => chip.remove());
    zoneElement.classList.remove("correct", "incorrect", "over");
    updateZoneCount(zoneElement);
  });
  buildTokens();
  updateScore();
  feedback.className = "feedback";
  feedback.textContent = message;
}

function updateZoneCount(zoneElement) {
  const zoneName = zoneElement.dataset.zone;
  const count = zonePlacements[zoneName].length;
  const max = zones[zoneName].accepts.length;
  zoneElement.querySelector(".slot-count").textContent = `${count}/${max}`;
  zoneElement.classList.toggle("correct", count === max);
}

function loadStoredLayout() {
  try {
    const stored = window.localStorage.getItem(layoutStorageKey);
    if (!stored) {
      return structuredClone(defaultLayout);
    }
    const parsed = JSON.parse(stored);
    return normalizeLayout(parsed.layout || parsed);
  } catch {
    return structuredClone(defaultLayout);
  }
}

function normalizeLayout(layout) {
  const normalized = structuredClone(defaultLayout);
  Object.keys(defaultLayout).forEach((zone) => {
    if (!layout || typeof layout[zone] !== "object") {
      return;
    }
    ["left", "top", "width", "height"].forEach((key) => {
      const value = Number(layout[zone][key]);
      if (Number.isFinite(value)) {
        normalized[zone][key] = value;
      }
    });
  });
  return normalized;
}

function applyLayout(layout) {
  dropZones.forEach((zoneElement) => {
    const zoneName = zoneElement.dataset.zone;
    const box = layout[zoneName];
    if (!box) {
      return;
    }
    zoneElement.style.left = `${box.left}%`;
    zoneElement.style.top = `${box.top}%`;
    zoneElement.style.width = `${box.width}%`;
    zoneElement.style.height = `${box.height}px`;
    zoneElement.style.minHeight = "0";
  });
  layoutJson.value = JSON.stringify({ layout, tokens }, null, 2);
}

function saveLayout() {
  window.localStorage.setItem(layoutStorageKey, JSON.stringify({ layout: currentLayout, tokens }));
  layoutJson.value = JSON.stringify({ layout: currentLayout, tokens }, null, 2);
  setFeedback("Layout saved in this browser. Export JSON if you want to reuse it elsewhere.", true);
}

function setEditMode(enabled) {
  editMode = enabled;
  diagramMap.classList.toggle("editing", enabled);
  layoutEditor.hidden = !enabled;
  editModeBtn.setAttribute("aria-pressed", String(enabled));
  editModeBtn.textContent = enabled ? "Done Editing" : "Edit Layout";
  setFeedback(
    enabled
      ? "Edit mode is on. Move boxes by dragging them; resize with the lower-right handle."
      : "Edit mode is off. Drag cards onto the synapse or modulation sites.",
    true,
  );
}

function zoneLayoutFromElement(zoneElement) {
  const mapRect = diagramMap.getBoundingClientRect();
  const zoneRect = zoneElement.getBoundingClientRect();
  return {
    left: ((zoneRect.left - mapRect.left) / mapRect.width) * 100,
    top: ((zoneRect.top - mapRect.top) / mapRect.height) * 100,
    width: (zoneRect.width / mapRect.width) * 100,
    height: zoneRect.height,
  };
}

function constrainLayout(box) {
  const minWidth = 10;
  const minHeight = 54;
  const maxWidth = 36;
  const maxHeight = 220;
  return {
    left: Math.min(98 - minWidth, Math.max(0, box.left)),
    top: Math.min(96, Math.max(0, box.top)),
    width: Math.min(maxWidth, Math.max(minWidth, box.width)),
    height: Math.min(maxHeight, Math.max(minHeight, box.height)),
  };
}

function updateElementLayout(zoneElement, box) {
  const zoneName = zoneElement.dataset.zone;
  currentLayout[zoneName] = constrainLayout(box);
  applyLayout(currentLayout);
}

function addResizeHandles() {
  dropZones.forEach((zoneElement) => {
    if (zoneElement.querySelector(".resize-handle")) {
      return;
    }
    const handle = document.createElement("span");
    handle.className = "resize-handle";
    handle.setAttribute("aria-hidden", "true");
    zoneElement.appendChild(handle);
  });
}

function zoneOptions(selectedZone) {
  return Object.entries(baseZones)
    .map(([zoneName, zone]) => `<option value="${zoneName}" ${zoneName === selectedZone ? "selected" : ""}>${zone.label}</option>`)
    .join("");
}

function kindOptions(selectedKind) {
  return ["peripheral", "excitatory", "inhibitory", "descending"]
    .map((kind) => `<option value="${kind}" ${kind === selectedKind ? "selected" : ""}>${kind}</option>`)
    .join("");
}

function renderAnswerKeyEditor() {
  answerKeyEditor.innerHTML = "";
  tokens.forEach((token) => {
    const row = document.createElement("div");
    row.className = "answer-row";
    row.dataset.id = token.id;
    row.innerHTML = `
      <label>
        Card text
        <input data-field="text" value="${escapeAttribute(token.text)}" />
      </label>
      <label>
        Type
        <select data-field="kind">${kindOptions(token.kind)}</select>
      </label>
      <label>
        Correct drop box
        <select data-field="targetZone">${zoneOptions(token.targetZone)}</select>
      </label>
      <label>
        Correct feedback
        <input data-field="feedback" value="${escapeAttribute(token.feedback)}" />
      </label>
      <button class="delete-item-btn" type="button">Delete</button>
    `;
    answerKeyEditor.appendChild(row);
  });
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readAnswerEditor() {
  const nextTokens = [];
  answerKeyEditor.querySelectorAll(".answer-row").forEach((row) => {
    const id = row.dataset.id;
    const text = row.querySelector('[data-field="text"]').value.trim();
    if (!text) {
      return;
    }
    nextTokens.push({
      id,
      text,
      kind: row.querySelector('[data-field="kind"]').value,
      targetZone: row.querySelector('[data-field="targetZone"]').value,
      feedback: row.querySelector('[data-field="feedback"]').value.trim() || `Correct: ${text} belongs at this site.`,
    });
  });
  tokens = normalizeTokens(nextTokens);
  zones = buildZones(tokens);
}

function saveItems() {
  readAnswerEditor();
  window.localStorage.setItem(itemStorageKey, JSON.stringify(tokens));
  renderAnswerKeyEditor();
  resetGameState("Drag items and answer key saved.");
  saveLayout();
}

function addDragItem() {
  readAnswerEditor();
  const baseText = "Glutamate";
  let id = makeTokenId(baseText);
  let counter = 2;
  const existing = new Set(tokens.map((token) => token.id));
  while (existing.has(id)) {
    id = `${makeTokenId(baseText)}-${counter}`;
    counter += 1;
  }
  tokens.push({
    id,
    text: counter > 2 ? `Glutamate ${counter - 1}` : baseText,
    kind: "excitatory",
    targetZone: "primarySynapse",
    feedback: "Correct: glutamate is an excitatory transmitter released by primary nociceptive afferents.",
  });
  zones = buildZones(tokens);
  renderAnswerKeyEditor();
  resetGameState("New drag item added. Edit its text or correct drop box, then save.");
}

function beginLayoutEdit(event, zoneElement, mode) {
  if (!editMode || event.button !== 0) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  const mapRect = diagramMap.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const start = zoneLayoutFromElement(zoneElement);
  zoneElement.setPointerCapture(event.pointerId);

  function move(pointerEvent) {
    const dxPct = ((pointerEvent.clientX - startX) / mapRect.width) * 100;
    const dyPct = ((pointerEvent.clientY - startY) / mapRect.height) * 100;
    const dyPx = pointerEvent.clientY - startY;
    if (mode === "move") {
      updateElementLayout(zoneElement, {
        ...start,
        left: start.left + dxPct,
        top: start.top + dyPct,
      });
      return;
    }
    updateElementLayout(zoneElement, {
      ...start,
      width: start.width + dxPct,
      height: start.height + dyPx,
    });
  }

  function end(pointerEvent) {
    zoneElement.releasePointerCapture(pointerEvent.pointerId);
    zoneElement.removeEventListener("pointermove", move);
    zoneElement.removeEventListener("pointerup", end);
    zoneElement.removeEventListener("pointercancel", end);
    layoutJson.value = JSON.stringify(currentLayout, null, 2);
  }

  zoneElement.addEventListener("pointermove", move);
  zoneElement.addEventListener("pointerup", end);
  zoneElement.addEventListener("pointercancel", end);
}

function addChip(zoneElement, token) {
  const chip = document.createElement("span");
  chip.className = "placed-chip";
  chip.textContent = token.text;
  zoneElement.appendChild(chip);
}

function placeToken(tokenId, zoneElement) {
  const zoneName = zoneElement.dataset.zone;
  const zone = zones[zoneName];
  const token = tokens.find((item) => item.id === tokenId);

  if (!token || placed.has(tokenId)) {
    return;
  }

  if (!zone.accepts.includes(tokenId)) {
    zoneElement.classList.add("incorrect");
    setFeedback(`${token.text} does not belong at "${zone.label}." Try another site.`, false);
    window.setTimeout(() => zoneElement.classList.remove("incorrect"), 650);
    return;
  }

  placed.add(tokenId);
  zonePlacements[zoneName].push(tokenId);
  document.querySelector(`.token[data-id="${tokenId}"]`).classList.add("placed");
  document.querySelector(`.token[data-id="${tokenId}"]`).draggable = false;
  addChip(zoneElement, token);
  updateZoneCount(zoneElement);
  updateScore();

  const done = zonePlacements[zoneName].length === zone.accepts.length;
  setFeedback(done ? `${token.feedback} ${zone.completeText}` : token.feedback, true);

  if (placed.size === tokens.length) {
    feedback.textContent = "Map complete. Nice work: you placed every mediator at the correct spinal or peripheral site.";
  }
}

dropZones.forEach((zoneElement) => {
  zoneElement.addEventListener("pointerdown", (event) => {
    if (event.target.classList.contains("resize-handle")) {
      beginLayoutEdit(event, zoneElement, "resize");
      return;
    }
    beginLayoutEdit(event, zoneElement, "move");
  });

  zoneElement.addEventListener("dragover", (event) => {
    if (editMode) {
      return;
    }
    event.preventDefault();
    zoneElement.classList.add("over");
  });

  zoneElement.addEventListener("dragleave", () => {
    zoneElement.classList.remove("over");
  });

  zoneElement.addEventListener("drop", (event) => {
    if (editMode) {
      return;
    }
    event.preventDefault();
    zoneElement.classList.remove("over");
    placeToken(event.dataTransfer.getData("text/plain"), zoneElement);
  });
});

resetBtn.addEventListener("click", () => {
  resetGameState();
});

reviewBtn.addEventListener("click", () => {
  if (editMode) {
    setFeedback("Turn off Edit Layout before showing the completed answer map.", false);
    return;
  }
  tokens.forEach((token) => {
    const targetZone = dropZones.find((zoneElement) => zones[zoneElement.dataset.zone].accepts.includes(token.id));
    if (targetZone && !placed.has(token.id)) {
      placeToken(token.id, targetZone);
    }
  });
  feedback.className = "feedback good";
  feedback.textContent = "Completed map shown. Use Reset to play again from memory.";
});

editModeBtn.addEventListener("click", () => setEditMode(!editMode));

saveLayoutBtn.addEventListener("click", saveLayout);

resetLayoutBtn.addEventListener("click", () => {
  currentLayout = structuredClone(defaultLayout);
  applyLayout(currentLayout);
  saveLayout();
  setFeedback("Drop boxes returned to the default layout.", true);
});

exportLayoutBtn.addEventListener("click", () => {
  readAnswerEditor();
  layoutJson.value = JSON.stringify({ layout: currentLayout, tokens }, null, 2);
  layoutJson.focus();
  layoutJson.select();
  setFeedback("Layout and answer-key JSON is selected. Copy it to keep a backup or reuse it in another copy.", true);
});

importLayoutBtn.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(layoutJson.value);
    currentLayout = normalizeLayout(parsed.layout || parsed);
    if (Array.isArray(parsed.tokens)) {
      tokens = normalizeTokens(parsed.tokens);
      zones = buildZones(tokens);
      window.localStorage.setItem(itemStorageKey, JSON.stringify(tokens));
      renderAnswerKeyEditor();
      resetGameState("Imported layout and answer key applied.");
    }
    applyLayout(currentLayout);
    saveLayout();
    setFeedback("Imported layout and answer key applied and saved.", true);
  } catch {
    setFeedback("That layout JSON could not be read. Check for missing braces or stray text.", false);
  }
});

addItemBtn.addEventListener("click", addDragItem);

saveItemsBtn.addEventListener("click", saveItems);

resetItemsBtn.addEventListener("click", () => {
  tokens = structuredClone(defaultTokens);
  zones = buildZones(tokens);
  window.localStorage.setItem(itemStorageKey, JSON.stringify(tokens));
  renderAnswerKeyEditor();
  resetGameState("Drag items and answer key returned to defaults.");
  saveLayout();
});

answerKeyEditor.addEventListener("click", (event) => {
  if (!event.target.classList.contains("delete-item-btn")) {
    return;
  }
  event.target.closest(".answer-row").remove();
  readAnswerEditor();
  renderAnswerKeyEditor();
  resetGameState("Drag item removed. Save Items to keep this change.");
});

buildTokens();
addResizeHandles();
applyLayout(currentLayout);
renderAnswerKeyEditor();
dropZones.forEach(updateZoneCount);
updateScore();
