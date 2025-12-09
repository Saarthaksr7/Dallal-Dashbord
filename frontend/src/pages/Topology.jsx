import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { api } from '../lib/api';
import { Server, Globe, Database, Monitor } from 'lucide-react';

// --- Custom Node Component ---
const ServiceNode = ({ data }) => {
    const isOnline = data.is_active;
    const Icon = data.icon || Server;

    return (
        <div style={{
            padding: '10px 15px',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            border: `2px solid ${isOnline ? '#22c55e' : '#ef4444'}`,
            minWidth: '150px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            color: 'var(--text-primary)'
        }}>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                <Icon size={20} color={isOnline ? '#22c55e' : '#ef4444'} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{data.label}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{data.ip}</div>
            {data.metrics && (
                <div style={{ fontSize: '0.7rem', marginTop: '4px', color: '#3b82f6' }}>
                    {data.metrics}
                </div>
            )}
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

const nodeTypes = { service: ServiceNode };

// --- Layout Helper ---
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 180;
    const nodeHeight = 100;

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = 'top';
        node.sourcePosition = 'bottom';
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
        return node;
    });

    return { nodes, edges };
};

const Topology = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const onInit = useCallback((reactFlowInstance) => {
        reactFlowInstance.fitView();
    }, []);

    const fetchGraph = async () => {
        try {
            const res = await api.get('/services/');
            const services = res.data;

            const newNodes = services.map(svc => ({
                id: svc.id.toString(),
                type: 'service',
                data: {
                    label: svc.name,
                    ip: svc.ip,
                    is_active: svc.is_active,
                    icon: svc.check_type === 'http' ? Globe : (svc.vendor ? Monitor : Server),
                    metrics: svc.response_time_ms ? `${svc.response_time_ms}ms` : ''
                },
                position: { x: 0, y: 0 } // Layout will overwrite
            }));

            const newEdges = services
                .filter(svc => svc.parent_id)
                .map(svc => ({
                    id: `e${svc.parent_id}-${svc.id}`,
                    source: svc.parent_id.toString(),
                    target: svc.id.toString(),
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#555' },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
                }));

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                newNodes,
                newEdges
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        } catch (err) {
            console.error("Failed to fetch topology", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
        const interval = setInterval(fetchGraph, 10000); // Poll status
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 100px)', padding: '1rem' }}>
            <h1 className="page-title" style={{ marginBottom: '1rem' }}>Network Topology</h1>

            <div style={{
                width: '100%', height: '100%',
                background: 'var(--bg-secondary)',
                borderRadius: '12px', border: '1px solid var(--border)',
                overflow: 'hidden'
            }}>
                {loading && nodes.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Topology...</div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onInit={onInit}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Controls style={{ fill: '#fff' }} />
                        <Background color="#aaa" gap={16} />
                    </ReactFlow>
                )}
            </div>
        </div>
    );
};

export default Topology;
