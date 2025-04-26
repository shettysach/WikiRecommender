import { fetchAndRenderGraph as sigmaRender } from "./dist/sigma_graph.js";
import { fetchAndRenderGraph as visRender } from "./dist/vis_graph.js";

let currentTab = "sigma";
let cachedData = null;
let rendered = {
  sigma: false,
  vis: false,
};

window.switchGraphTab = function (tab) {
  currentTab = tab;

  document.getElementById("sigma-graph").style.display =
    tab === "sigma" ? "block" : "none";
  document.getElementById("vis-graph").style.display =
    tab === "vis" ? "block" : "none";

  const sigmaBtn = document.getElementById("sigma-tab");
  const visBtn = document.getElementById("vis-tab");

  if (tab === "sigma") {
    sigmaBtn.className = "tab tab-active";
    visBtn.className = "tab tab-inactive";
  } else {
    visBtn.className = "tab tab-active";
    sigmaBtn.className = "tab tab-inactive";
  }

  reloadGraph(); // triggers tab-specific render
};

window.reloadGraph = async function () {
  const tab = currentTab;
  const render = tab === "sigma" ? sigmaRender : visRender;
  const id = tab === "sigma" ? "sigma-graph" : "vis-graph";

  if (!cachedData) {
    try {
      console.log("↻ Fetching graph data...");
      const response = await fetch("http://127.0.0.1:8000/graph");
      cachedData = await response.json();
      rendered = { sigma: false, vis: false }; // allow re-render
    } catch (err) {
      console.error("❌ Error fetching graph data:", err);
      return;
    }
  }

  if (!rendered[tab]) {
    await render(id, cachedData);
    rendered[tab] = true;
  }
};

window.loadGraph = async function () {
  cachedData = null;
  rendered = { sigma: false, vis: false };
  await reloadGraph();
};

reloadGraph();
