const zones = {
  skin: {
    label: "Inflammatory sensitizers at the skin nociceptor terminal",
    accepts: ["histamine", "cytokines", "prostaglandins"],
    completeText: "Peripheral inflammatory mediators sensitize nociceptor endings before the signal reaches the cord.",
  },
  primarySynapse: {
    label: "Primary afferent to second-order projection neuron",
    accepts: ["glutamate", "substance-p"],
    completeText: "Primary afferents release glutamate for fast excitation and substance P with stronger or sustained input.",
  },
  presynapticInhibition: {
    label: "Interneuron onto first-order afferent terminal",
    accepts: ["gaba"],
    completeText: "GABAergic axo-axonic inhibition reduces transmitter release from the nociceptor central terminal.",
  },
  postsynapticInhibition: {
    label: "Interneuron onto projection neuron",
    accepts: ["glycine", "enkephalin", "gaba-post"],
    completeText: "Spinal inhibitory interneurons reduce projection neuron excitability through fast inhibition and opioid modulation.",
  },
  descending: {
    label: "Descending RVM and LC modulation",
    accepts: ["serotonin", "norepinephrine"],
    completeText: "RVM 5-HT pathways can inhibit or facilitate; LC norepinephrine is classically inhibitory in the dorsal horn.",
  },
};

const tokens = [
  {
    id: "histamine",
    text: "Histamine",
    kind: "peripheral",
    feedback: "Correct: histamine from peripheral inflammatory cells can sensitize nociceptor endings in skin.",
  },
  {
    id: "cytokines",
    text: "Cytokines",
    kind: "peripheral",
    feedback: "Correct: inflammatory cytokines act around injured tissue and can amplify nociceptor responsiveness.",
  },
  {
    id: "prostaglandins",
    text: "Prostaglandins",
    kind: "peripheral",
    feedback: "Correct: prostaglandins are classic peripheral sensitizers at nociceptor terminals.",
  },
  {
    id: "glutamate",
    text: "Glutamate",
    kind: "excitatory",
    feedback: "Correct: glutamate is the main fast excitatory transmitter released by primary nociceptive afferents.",
  },
  {
    id: "substance-p",
    text: "Substance P",
    kind: "excitatory",
    feedback: "Correct: substance P is released by nociceptive afferents, especially with intense or sustained input.",
  },
  {
    id: "gaba",
    text: "GABA, presynaptic",
    kind: "inhibitory",
    feedback: "Correct: GABA can inhibit transmitter release from the primary afferent terminal.",
  },
  {
    id: "gaba-post",
    text: "GABA, postsynaptic",
    kind: "inhibitory",
    feedback: "Correct: GABA also inhibits dorsal horn neurons postsynaptically.",
  },
  {
    id: "glycine",
    text: "Glycine",
    kind: "inhibitory",
    feedback: "Correct: glycine is a fast inhibitory transmitter in spinal cord circuits.",
  },
  {
    id: "enkephalin",
    text: "Enkephalin",
    kind: "inhibitory",
    feedback: "Correct: enkephalin is an endogenous opioid that dampens nociceptive transmission in dorsal horn circuits.",
  },
  {
    id: "serotonin",
    text: "Serotonin, RVM",
    kind: "descending",
    feedback: "Correct: RVM serotonergic descending input can inhibit or facilitate spinal nociceptive processing.",
  },
  {
    id: "norepinephrine",
    text: "Norepinephrine, LC",
    kind: "descending",
    feedback: "Correct: LC noradrenergic input commonly inhibits dorsal horn pain transmission through alpha-2 effects.",
  },
];

const tokenTray = document.querySelector("#tokenTray");
const feedback = document.querySelector("#feedback");
const scoreEl = document.querySelector("#score");
const totalEl = document.querySelector("#total");
const resetBtn = document.querySelector("#resetBtn");
const reviewBtn = document.querySelector("#reviewBtn");
const dropZones = [...document.querySelectorAll(".drop-zone")];

const placed = new Set();
const zonePlacements = Object.fromEntries(Object.keys(zones).map((zone) => [zone, []]));

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

function updateZoneCount(zoneElement) {
  const zoneName = zoneElement.dataset.zone;
  const count = zonePlacements[zoneName].length;
  const max = zones[zoneName].accepts.length;
  zoneElement.querySelector(".slot-count").textContent = `${count}/${max}`;
  zoneElement.classList.toggle("correct", count === max);
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
  zoneElement.addEventListener("dragover", (event) => {
    event.preventDefault();
    zoneElement.classList.add("over");
  });

  zoneElement.addEventListener("dragleave", () => {
    zoneElement.classList.remove("over");
  });

  zoneElement.addEventListener("drop", (event) => {
    event.preventDefault();
    zoneElement.classList.remove("over");
    placeToken(event.dataTransfer.getData("text/plain"), zoneElement);
  });
});

resetBtn.addEventListener("click", () => {
  placed.clear();
  Object.keys(zonePlacements).forEach((zone) => {
    zonePlacements[zone] = [];
  });
  dropZones.forEach((zoneElement) => {
    [...zoneElement.querySelectorAll(".placed-chip")].forEach((chip) => chip.remove());
    zoneElement.classList.remove("correct", "incorrect", "over");
    updateZoneCount(zoneElement);
  });
  buildTokens();
  updateScore();
  feedback.className = "feedback";
  feedback.textContent = "Drag a card onto a synapse or modulation site.";
});

reviewBtn.addEventListener("click", () => {
  tokens.forEach((token) => {
    const targetZone = dropZones.find((zoneElement) => zones[zoneElement.dataset.zone].accepts.includes(token.id));
    if (targetZone && !placed.has(token.id)) {
      placeToken(token.id, targetZone);
    }
  });
  feedback.className = "feedback good";
  feedback.textContent = "Completed map shown. Use Reset to play again from memory.";
});

buildTokens();
dropZones.forEach(updateZoneCount);
updateScore();
