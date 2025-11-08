"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyElkLayout = applyElkLayout;
const elk_bundled_js_1 = __importDefault(require("elkjs/lib/elk.bundled.js"));
const elk = new elk_bundled_js_1.default();
const elkOptions = {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.spacing.nodeNode': '80',
    'elk.direction': 'DOWN'
};
async function applyElkLayout(nodes, edges) {
    const graph = {
        id: 'root',
        layoutOptions: elkOptions,
        children: nodes.map((node) => ({
            id: node.id,
            width: 250,
            height: 150
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target]
        }))
    };
    const layoutedGraph = await elk.layout(graph);
    const layoutedNodes = nodes.map((node) => {
        const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
        return {
            ...node,
            position: {
                x: layoutedNode?.x ?? node.position.x,
                y: layoutedNode?.y ?? node.position.y
            }
        };
    });
    return layoutedNodes;
}
//# sourceMappingURL=layout.js.map