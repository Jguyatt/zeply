'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Eye, Save, Send, Plus, Trash2, Settings, X, AlertCircle } from 'lucide-react';
import { checkNodeCompletion } from '@/app/lib/onboarding-node-validation';
import type { OnboardingFlowWithNodes, OnboardingNode as OnboardingNodeType } from '@/app/types/onboarding';
import OnboardingNode from './OnboardingNode';
import StepLibrary from './StepLibrary';
import NodeEditModal from './NodeEditModal';
import StepEditorModal from './StepEditorModal';
import StepPreview from './StepPreview';

interface OnboardingFlowBuilderProps {
  orgId: string;
  clerkOrgId: string;
  orgName: string;
  embedded?: boolean;
}

// Define nodeTypes OUTSIDE component to avoid React Flow warning
const nodeTypes = {
  onboarding: OnboardingNode,
};

function OnboardingFlowBuilderInner({
  orgId,
  clerkOrgId,
  orgName,
  embedded = false,
}: OnboardingFlowBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flow, setFlow] = useState<OnboardingFlowWithNodes | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewNode, setPreviewNode] = useState<any>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);


  // Store handlers in refs to avoid circular dependency issues
  const handleDeleteNodeRef = React.useRef<((nodeId: string) => Promise<void>) | null>(null);

  const convertToReactFlow = useCallback((flowData: OnboardingFlowWithNodes) => {
    // Convert nodes to ReactFlow format
    console.log('convertToReactFlow - nodes:', flowData.nodes);
    const reactFlowNodes: Node[] = flowData.nodes.map((node, index) => {
      const nodeConfig = node.config || {};
      console.log(`convertToReactFlow - node ${node.id} config:`, nodeConfig);
      
      // Check completion status
      const completionStatus = checkNodeCompletion(node.type, nodeConfig, node.title);
      
      return {
      id: node.id,
      type: 'onboarding',
      position: node.position || { x: (index + 1) * 200, y: 100 },
      data: {
        label: node.title,
        type: node.type,
        required: node.required,
          description: node.description,
          config: nodeConfig,
          title: node.title,
        isComplete: completionStatus.isComplete,
        missingFields: completionStatus.missingFields,
        onDelete: () => handleDeleteNodeRef.current?.(node.id),
          // Spread other node properties
          id: node.id,
          flow_id: node.flow_id,
          order_index: node.order_index,
          created_at: node.created_at,
          updated_at: node.updated_at,
      },
      };
    });

    // Convert edges to ReactFlow format
    const reactFlowEdges: Edge[] = flowData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      type: 'smoothstep',
    }));

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [setNodes, setEdges]);

  const initializeFlow = useCallback(async () => {
    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error initializing flow:', error);
        throw new Error(error.error || 'Failed to initialize flow');
      }

      const result = await response.json();
      if (result.data) {
        const flowData = result.data;
        setFlow(flowData);
        // Convert to ReactFlow format immediately
        convertToReactFlow(flowData);
        return flowData;
      } else {
        throw new Error(result.error || 'No data returned');
      }
    } catch (error) {
      console.error('Error initializing flow:', error);
      throw error;
    }
  }, [clerkOrgId, setNodes, setFlow]);

  const loadFlow = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/flow?draft=true`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 400 && error.error?.includes('Invalid org ID')) {
          // Org might not exist - will be created on first node add
          console.log('Org not found, will be created when needed');
        } else {
          console.error('Error loading flow:', error);
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('loadFlow - result:', result);

      if (result.data) {
        console.log('loadFlow - flow data:', result.data);
        console.log('loadFlow - nodes:', result.data.nodes);
        if (result.data.nodes && result.data.nodes.length > 0) {
          console.log('loadFlow - first node config:', result.data.nodes[0].config);
        }
        setFlow(result.data);
        convertToReactFlow(result.data);
      } else {
        // No flow exists - initialize default flow with prebuilt nodes
        console.log('No flow found, initializing default flow...');
        try {
          const initResponse = await fetch(`/api/orgs/${clerkOrgId}/onboarding/flow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (initResponse.ok) {
            const initResult = await initResponse.json();
            if (initResult.data) {
              setFlow(initResult.data);
              convertToReactFlow(initResult.data);
            }
          }
        } catch (initError) {
          console.error('Error initializing default flow:', initError);
        }
      }
    } catch (error) {
      console.error('Error loading flow:', error);
    } finally {
      setLoading(false);
    }
  }, [clerkOrgId, convertToReactFlow]);

  useEffect(() => {
    if (clerkOrgId) {
      loadFlow();
    }
  }, [clerkOrgId, loadFlow]);

  // Recalculate completion status when nodes update
  // This runs whenever nodes change, recalculating completion for all nodes
  useEffect(() => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        const completionStatus = checkNodeCompletion(
          node.data.type,
          node.data.config || {},
          node.data.title || node.data.label
        );
        return {
          ...node,
          data: {
            ...node.data,
            isComplete: completionStatus.isComplete,
            missingFields: completionStatus.missingFields,
          },
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, nodes.map(n => JSON.stringify({ id: n.id, config: n.data.config, title: n.data.title || n.data.label })).join('|')]);

  // Sync selectedNode when nodes update (e.g., after saving)
  useEffect(() => {
    if (selectedNode) {
      const updatedNode = nodes.find(n => n.id === selectedNode.id);
      if (updatedNode) {
        // Always update to ensure fresh data is shown
        const configChanged = JSON.stringify(updatedNode.data.config || {}) !== JSON.stringify(selectedNode.data.config || {});
        const titleChanged = updatedNode.data.title !== selectedNode.data.title;
        if (configChanged || titleChanged) {
          console.log('Updating selectedNode:', {
            oldConfig: selectedNode.data.config,
            newConfig: updatedNode.data.config,
          });
          setSelectedNode(updatedNode);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!flow || !params.source || !params.target) return;
      
      // Optimistically add edge to UI
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
      
      // Create edge in database
      try {
        const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/edges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flowId: flow.id,
            sourceId: params.source,
            targetId: params.target,
          }),
        });

        if (!response.ok) {
          // Remove edge on error
          setEdges((eds) => eds.filter((e) => !(e.source === params.source && e.target === params.target)));
          const error = await response.json().catch(() => ({ error: 'Failed to create edge' }));
          console.error('Error creating edge:', error);
          alert(error.error || 'Failed to create connection');
        } else {
          // Reload flow to get the edge with proper ID
          loadFlow();
        }
      } catch (error) {
        // Remove edge on error
        setEdges((eds) => eds.filter((e) => !(e.source === params.source && e.target === params.target)));
        console.error('Error creating edge:', error);
        alert('Failed to create connection. Please try again.');
      }
    },
    [setEdges, flow, clerkOrgId, loadFlow]
  );

  // Handle node position changes (when dragging)
  const onNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      // Save node position when drag stops
      try {
        await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: node.id,
            position: node.position,
          }),
        });
      } catch (error) {
        console.error('Error saving node position:', error);
      }
    },
    [clerkOrgId]
  );

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // Save all node positions and data
      for (const node of nodes) {
        const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: node.id,
            position: node.position,
            title: node.data.label || node.data.title,
            description: node.data.description,
            required: node.data.required,
            config: node.data.config || {},
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save node');
        }
      }

      router.refresh();
      // Success - UI will update via loadFlow
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      // Could add toast notification here if needed
      console.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Check if all nodes are complete
  const allNodesComplete = useMemo(() => {
    if (nodes.length === 0) return false;
    return nodes.every(node => node.data.isComplete);
  }, [nodes]);

  // Get incomplete nodes for warning message
  const incompleteNodes = useMemo(() => {
    return nodes.filter(node => !node.data.isComplete);
  }, [nodes]);

  const handlePublish = async () => {
    if (!flow) return;

    // Check completion before publishing
    if (!allNodesComplete) {
      const incompleteList = incompleteNodes.map(n => n.data.label).join(', ');
      alert(`Cannot publish: The following nodes are incomplete:\n${incompleteList}\n\nPlease complete all nodes before publishing.`);
      return;
    }

    setSaving(true);
    try {
      // Save all node positions and data before publishing
      for (const node of nodes) {
        const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: node.id,
            position: node.position,
            title: node.data.label || node.data.title,
            description: node.data.description,
            required: node.data.required,
            config: node.data.config || {},
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save node');
        }
      }

      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          flowId: flow.id,
        }),
      });

      if (response.ok) {
        router.refresh();
        alert('Flow published successfully');
      } else {
        throw new Error('Failed to publish');
      }
    } catch (error) {
      console.error('Error publishing flow:', error);
      alert('Failed to publish flow');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNode = useCallback(async (type: string, position?: { x: number; y: number }, sourceNodeId?: string) => {
    // Ensure we have a flow first
    let currentFlow = flow;
    if (!currentFlow) {
      try {
        const initializedFlow = await initializeFlow();
        if (!initializedFlow) {
          console.error('Failed to initialize flow');
          return;
        }
        currentFlow = initializedFlow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize flow';
        console.error('Error initializing flow:', errorMessage);
        // Error will be shown via the initializeFlow error handling
        return;
      }
    }

    // FIX: Add check for TypeScript that currentFlow is not null
    if (!currentFlow) {
      return;
    }

    // FIX: Explicitly type and initialize nodePosition to match ReactFlow types
    let nodePosition: { x: number; y: number };
    
    if (position) {
      nodePosition = position;
    } else if (reactFlowInstance) {
      nodePosition = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    } else {
      nodePosition = { x: (nodes.length + 1) * 200, y: 100 };
    }

    // Optimistically add node to UI immediately
    const tempId = `temp-${Date.now()}`;
    const newNode: Node = {
      id: tempId,
      type: 'onboarding',
      position: nodePosition,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
        type,
        required: false,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
        onDelete: () => handleDeleteNodeRef.current?.(tempId),
      },
    };

    setNodes((nds) => [...nds, newNode]);

    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: currentFlow.id,
          type,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
          // Don't specify order_index - let backend calculate next available
          position: nodePosition,
        }),
      });

      if (response.ok) {
        let result;
        try {
          const text = await response.text();
          result = text ? JSON.parse(text) : { data: null };
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          // Remove optimistic node on error
          setNodes((nds) => nds.filter((n) => n.id !== tempId));
          alert('Failed to parse server response. Please try again.');
          return;
        }
        
        // Update the temp node with real ID
        if (result.data) {
          const newNodeId = result.data.id;
          setNodes((nds) => {
            const updatedNode = {
              id: newNodeId,
              type: 'onboarding',
              position: nodePosition,
              data: {
                ...nds.find((n) => n.id === tempId)?.data,
                ...result.data,
                onDelete: () => handleDeleteNodeRef.current?.(newNodeId),
              },
            };
            const newNodes = nds.map((n) => (n.id === tempId ? updatedNode : n));
            // Select the new node to show preview
            setSelectedNode(updatedNode);
            setPreviewMode('preview');
            return newNodes;
          });
          
          // If this node was added after another node, create the edge
          if (sourceNodeId) {
            setTimeout(async () => {
              try {
                await fetch(`/api/orgs/${clerkOrgId}/onboarding/edges`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    flowId: currentFlow!.id, // Non-null assertion
                    sourceId: sourceNodeId,
                    targetId: newNodeId,
                  }),
                });
                // Reload to show the edge
                loadFlow();
              } catch (error) {
                console.error('Error creating edge:', error);
              }
            }, 100);
          }
        } else {
          // Reload if we don't get the node back
          loadFlow();
        }
      } else {
        // Remove optimistic node on error
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
        const error = await response.json();
        console.error('Error adding node:', error);
        alert(error.error || 'Failed to add node');
      }
    } catch (error) {
      // Remove optimistic node on error
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
      console.error('Error adding node:', error);
      alert('Failed to add node. Please try again.');
    }
  }, [flow, reactFlowInstance, nodes.length, clerkOrgId, initializeFlow, loadFlow, setNodes]);


  // Delete node handler
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes?nodeId=${nodeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from UI immediately
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        // Reload flow to sync
        loadFlow();
        // Clear selection if deleted node was selected
        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
        }
      } else {
        let errorMessage = 'Failed to delete node';
        try {
        const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Error deleting node:', errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete node';
      alert(errorMessage);
    }
  }, [clerkOrgId, loadFlow, setNodes, setEdges, selectedNode]);

  // Store in ref so it can be accessed by convertToReactFlow
  React.useEffect(() => {
    handleDeleteNodeRef.current = handleDeleteNode;
  }, [handleDeleteNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) {
        console.log('No type in drag data');
        return;
      }

      if (!reactFlowInstance) {
        console.log('ReactFlow instance not ready');
        // Try to add at center anyway
        handleAddNode(type);
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      handleAddNode(type, position);
    },
    [reactFlowInstance, handleAddNode]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-charcoal">
        <div className="glass-panel p-8 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#4C8DFF] border-t-transparent rounded-full animate-spin" />
        <div className="text-secondary">Loading flow builder...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'h-full' : 'h-screen'} flex flex-col bg-charcoal`}>
      {/* Top Bar */}
      <div className="glass-border-b p-4 flex items-center justify-between flex-shrink-0 bg-charcoal">
        <div className="flex items-center gap-4">
          {!embedded && <h1 className="text-xl font-bold text-primary">Client: {orgName}</h1>}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              flow?.status === 'published'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            }`}
          >
            {flow?.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!allNodesComplete && (
            <div className="flex items-center gap-2 px-3 py-2 glass-surface rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400">
                {incompleteNodes.length} node{incompleteNodes.length !== 1 ? 's' : ''} incomplete
              </span>
            </div>
          )}
          <button
            onClick={handlePublish}
            disabled={saving || !allNodesComplete}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-prestige-soft border border-accent/30"
            title={!allNodesComplete ? 'Complete all nodes before publishing' : 'Publish flow'}
          >
            <Send className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Step Library */}
        <div className="w-64 glass-border-r p-4 overflow-y-auto flex-shrink-0 bg-charcoal">
          <StepLibrary onAddNode={handleAddNode} />
        </div>

        {/* Center - Canvas */}
        <div 
          className="flex-1 relative bg-charcoal transition-all" 
          style={{ width: '100%', height: '100%', minHeight: '500px' }}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNode(node);
            }}
            onPaneClick={() => {
              // Deselect node when clicking on empty canvas
              setSelectedNode(null);
            }}
            onNodeDragStop={onNodeDragStop}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            className="w-full h-full"
            style={{ width: '100%', height: '100%', background: '#1a1a1a' }}
            connectionLineStyle={{ stroke: '#C7CCD6', strokeWidth: 2, opacity: 0.6 }}
            defaultEdgeOptions={{
              style: { stroke: '#C7CCD6', strokeWidth: 2, opacity: 0.6 },
              type: 'smoothstep',
            }}
            nodesDraggable={true}
            nodesConnectable={true}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background 
              color="#2d2d2d" 
              gap={20}
              size={1}
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              className="glass-surface border border-white/10"
            />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.required) return '#C7CCD6';
                return '#666';
              }}
              className="glass-surface border border-white/10"
              style={{ backgroundColor: '#1a1a1a' }}
              maskColor="rgba(0, 0, 0, 0.6)"
            />
          </ReactFlow>
        </div>

              </div>
              
      {/* Node Edit Modal */}
      {selectedNode && (
        <NodeEditModal
                      node={selectedNode}
                      orgId={orgId}
                      clerkOrgId={clerkOrgId}
          onClose={() => setSelectedNode(null)}
                    onUpdate={async (updatedNodeData?: any) => {
                      // If we have the updated node data from the save response, use it directly
                      if (updatedNodeData) {
                        console.log('Updating node from save response:', updatedNodeData);
                        setNodes((currentNodes) => {
                          const newNodes = currentNodes.map((n) => {
                            if (n.id === selectedNode.id) {
                    // Recalculate completion status
                    const completionStatus = checkNodeCompletion(
                      n.data.type,
                      updatedNodeData.config || {},
                      updatedNodeData.title || n.data.title
                    );
                    
                    return {
                                ...n,
                                data: {
                                  ...n.data,
                                  config: updatedNodeData.config || {},
                                  title: updatedNodeData.title,
                                  description: updatedNodeData.description,
                        isComplete: completionStatus.isComplete,
                        missingFields: completionStatus.missingFields,
                                },
                              };
                            }
                            return n;
                          });
                          return newNodes;
                        });
                      } else {
              // Fallback: reload flow to get updated nodes
              await loadFlow();
                                  }
                      }}
                    />
                )}

      {/* Step Editor Modal */}
      {showPreview && previewNode && (
        <StepEditorModal
          node={previewNode}
          onClose={() => {
            setShowPreview(false);
            setPreviewNode(null);
          }}
          onSave={async (updatedNode) => {
            // Reload flow after saving
            await loadFlow();
            setShowPreview(false);
            setPreviewNode(null);
          }}
          clerkOrgId={clerkOrgId}
        />
      )}
    </div>
  );
}

export default function OnboardingFlowBuilder(props: OnboardingFlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <OnboardingFlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}