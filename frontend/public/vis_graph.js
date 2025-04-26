import { DataSet } from "vis-data";
import { Network } from "vis-network";

const BACKEND_URL = "http://127.0.0.1:8000/graph";

export async function fetchAndRenderGraph(containerId, data) {
  const nodeColorMap = new Map(
    data.nodes.map(({ key, attributes }) => [
      key,
      attributes?.color || "#999999",
    ]),
  );

  const nodes = data.nodes.map(({ key, attributes }) => {
    const color = attributes?.color || "#00000000";
    return {
      id: key,
      label: attributes?.label || key,
      title: attributes?.group || key,
      color,
      font: { color, strokeWidth: 0, size: 15 },
      // chosen: { label: { strokeWidth: 2, strokeColor: "#ffffff" } },
      shape: "dot",
      size: 15,
    };
  });

  const edges = data.edges.map(({ key, source, target, attributes }) => {
    const color = nodeColorMap.get(source) || "#00000000";
    return {
      id: key,
      from: source,
      to: target,
      label: attributes?.label || "",
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      color,
      font: { color, strokeWidth: 0, size: 10 },
    };
  });

  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const network = new Network(
    container,
    { nodes: new DataSet(nodes), edges: new DataSet(edges) },
    {
      interaction: { hover: true },
      physics: true,
    },
  );

  network.once("stabilizationIterationsDone", () => network.fit());
}
