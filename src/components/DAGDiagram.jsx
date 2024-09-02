import ReactFlow, {
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlowProvider,
    useNodesState
} from "react-flow-renderer";
import {useMemo, useState} from "react";
import dagre from "dagre";
import {v4 as uuidv4} from "uuid";

import Modal from 'react-bootstrap/Modal';
import Card from "react-bootstrap/Card";
import ListLabels from "./ListLabels";

const generateElementsFromData = (data) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({});
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 400;
    const nodeHeight = 100;

    // Add nodes to the graph
    data.nodes.forEach(node => {
        dagreGraph.setNode(node.id, { label: node.title, width: nodeWidth, height: nodeHeight });
    });

    // Add edges to the graph
    data.edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run the Dagre layout algorithm
    dagre.layout(dagreGraph);

    let minX = 0;
    let minY = 0;

    dagreGraph.nodes().forEach(v => {
        const node = dagreGraph.node(v);
        if (node) {
            if (node.x < minX) minX = node.x;
            if (node.y < minY) minY = node.y;
        }
    });

    // Create nodes
    const nodes = data.nodes.map(node => {
        const position = dagreGraph.node(node.id);
        position.x -= minX;
        position.y -= minY;
        return {
            id: node.id,
            position,
            type: 'custom',
            // assign any other data here that is needed to render the node
            data: { title: node.title, description: node.description, color: node.color }
        };
    });

    // Create edges
    const edges = data.edges.map(edge => ({
        id: `e.${uuidv4()}`,
        source: edge.source,
        target: edge.target,
        animated: true,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: '#00c4ff',
        },
        style: {
            strokeWidth: 2,
            stroke: '#00c4ff',
        },
        focusable: true
    }));

    return { nodes, edges };
}

const customNode = ({ data }) => {
    return (
        <>
            <Handle type="target" position={Position.Top} />
            <div style={{ backgroundColor: data.color, border: '1px solid #333', borderRadius: '5px', boxSizing: 'border-box', padding: '10px' }}>
                <h3>{data.title}</h3>
                <span style={{textAlign: "left"}}>{data.description}</span>
            </div>
            <Handle type="source" position={Position.Bottom} id="a" />
        </>
    )
}

const DAGDiagram = ({data}) => {
    const { nodes, edges } = generateElementsFromData(data);
    const [initialNodes, setNodes, onNodesChange] = useNodesState(nodes);
    const nodeTypes = useMemo(() => ({ custom: customNode }), []);
    const [showModal, setShowModal] = useState(false);
    const [selectedID, setSelectedID] = useState('');

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const RenderModal = ({data}) => {
        const node = data.nodes.find(i => i.id === selectedID);
        if (!node) {
            return
        }
        return (
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton className={node.status.ok ? 'bg-success text-white' : 'bg-danger text-white'}>
                    <Modal.Title>{node.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Card>
                        <Card.Body>
                            <Card.Title>{node.title}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">{node.description}</Card.Subtitle>
                            <Card.Text>
                                <b>Namespace:</b> {node.status.namespace}<br/>
                                <b>Created:</b> {node.status.created}<br/>
                                <b>Message:</b> {node.status.message}
                                {node.status.deployment_strategy && (
                                    <>
                                    <br/>
                                    <b>Deployment Strategy:</b> {node.status.deployment_strategy}
                                    </>
                                )}
                                {node.status.current_replicas && (
                                    <>
                                        <br/>
                                        <b>Current Replicas:</b> {node.status.current_replicas}
                                    </>
                                )}
                                {node.status.desired_replicas && (
                                    <>
                                        <br/>
                                        <b>Desired Replicas:</b> {node.status.desired_replicas}
                                    </>
                                )}
                                {node.status.service_account && (
                                    <>
                                        <br/>
                                        <b>Service Account:</b> {node.status.service_account}
                                    </>
                                )}
                                {node.status.node && (
                                    <>
                                        <br/>
                                        <b>Node:</b> {node.status.node}
                                    </>
                                )}
                                {node.status.controlled_by && (
                                    <>
                                        <br/>
                                        <b>Controlled By:</b> {node.status.controlled_by}
                                    </>
                                )}
                                {node.status.session_affinity && (
                                    <>
                                        <br/>
                                        <b>Session Affinity:</b> {node.status.session_affinity}
                                    </>
                                )}
                                {node.status.default_backend && (
                                    <>
                                        <br/>
                                        <b>Default Backend:</b> {node.status.default_backend}
                                    </>
                                )}
                                {node.status.selectors && (
                                    <>
                                        <br/>
                                        <ListLabels selector={true} labels={node.status.selectors} newLine={false}/>
                                    </>
                                )}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Modal.Body>
            </Modal>
        );
    };

    const onNodeClick = (event, element) => {
        setSelectedID(element.id)
        setShowModal(true);
    };

    return (
        <>
        <div style={{ height: '100vh' }} className={"text-center"}>
            <ReactFlowProvider>
                <ReactFlow nodeTypes={nodeTypes} nodes={initialNodes} edges={edges} fitView
                           onNodesChange={onNodesChange}
                           elementsSelectable
                           onNodeClick={onNodeClick}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
            <RenderModal data={data} />
            </>
    );
}

export default DAGDiagram;
