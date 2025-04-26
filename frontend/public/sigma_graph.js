import Graph from "graphology";
import Sigma from "sigma";
import EdgeCurveProgram from "@sigma/edge-curve";
import { assign as randomAssign } from "graphology-layout/random";
import { assign as forceAtlas2Assign } from "graphology-layout-forceatlas2";
import { degreeCentrality } from "graphology-metrics/centrality/degree";

export async function fetchAndRenderGraph(containerId, data) {
  const graph = new Graph({
    type: data.options.type ?? "directed",
    multi: data.options.multi ?? false,
    allowSelfLoops: data.options.allowSelfLoops ?? false,
  });

  for (const { key, attributes } of data.nodes) {
    const color = attributes?.color || "#00000000";
    graph.addNode(key, {
      ...attributes,
      label: attributes?.label ?? key,
      labelColor: color,
      color,
    });
  }

  for (const { key, source, target, attributes } of data.edges) {
    const sourceColor = graph.getNodeAttribute(source, "color") || "#00000000";
    graph.addEdgeWithKey(key, source, target, {
      ...attributes,
      type: "arrow",
      color: sourceColor,
      label: attributes?.label ?? "",
    });
  }

  const centralities = degreeCentrality(graph);

  for (const node in centralities) {
    const c = centralities[node];
    graph.setNodeAttribute(node, "size", 5 + c * 25);
  }
  randomAssign(graph);

  forceAtlas2Assign(graph, {
    iterations: 1000,
    settings: {
      barnesHutOptimize: true,
      barnesHutTheta: 0.5,

      gravity: 1,
      strongGravityMode: false,
      scalingRatio: 2,

      linLogMode: false,
      edgeWeightInfluence: 0,
      slowDown: 1,

      adjustSizes: true,
      outboundAttractionDistribution: true,
    },
  });

  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const renderer = new Sigma(graph, container, {
    renderEdgeLabels: true,
    edgeLabelSize: 10,
    labelColor: { attribute: "labelColor" },
    edgeProgramClasses: { curved: EdgeCurveProgram },
  });
}
