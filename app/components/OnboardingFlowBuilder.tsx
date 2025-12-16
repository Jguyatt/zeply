'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  BackgroundVariant, // Imported the enum
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Eye, Save, Send, Plus, Trash2, Settings, X } from 'lucide-react';
import type { OnboardingFlowWithNodes, OnboardingNode as OnboardingNodeType } from '@/app/types/onboarding';
import OnboardingNode from './OnboardingNode';
import StepLibrary from './StepLibrary';
import NodeSettingsPanel from './NodeSettingsPanel';
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
  const [previewMode, setPreviewMode] = useState<'settings' | 'preview'>('preview');
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);


  // Store handlers in refs to avoid circular dependency issues
  const handleDeleteNodeRef = React.useRef<((nodeId: string) => Promise<void>) | null>(null);

  const convertToReactFlow = useCallback((flowData: OnboardingFlowWithNodes) => {
    // Convert nodes to ReactFlow format
    console.log('convertToReactFlow - nodes:', flowData.nodes);
    const reactFlowNodes: Node[] = flowData.nodes.map((node, index) => {
      const nodeConfig = node.config || {};
      console.log(`convertToReactFlow - node ${node.id} config:`, nodeConfig);
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
        body: JSON.stringify({ action: 'init' }),
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
        // Load nodes after initialization
        const nodesResponse = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes?flowId=${flowData.id}`);
        if (nodesResponse.ok) {
          const nodesResult = await nodesResponse.json();
          if (nodesResult.data && nodesResult.data.length > 0) {
            const reactFlowNodes: Node[] = nodesResult.data.map((node: any, index: number) => ({
              id: node.id,
              type: 'onboarding',
              position: node.position || { x: (index + 1) * 200, y: 100 },
              data: {
                label: node.title,
                type: node.type,
                required: node.required,
                description: node.description,
                config: node.config || {},
                title: node.title,
                onDelete: () => handleDeleteNodeRef.current?.(node.id),
                // Spread other node properties
                id: node.id,
                flow_id: node.flow_id,
                order_index: node.order_index,
                created_at: node.created_at,
                updated_at: node.updated_at,
              },
            }));
            setNodes(reactFlowNodes);
          }
        }
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
      }
      // Don't auto-initialize - let user add nodes first
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

        if (response.ok) {
          setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
        }
      } catch (error) {
        console.error('Error creating edge:', error);
      }
    },
    [setEdges, flow, clerkOrgId]
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
      alert('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!flow) return;

    setSaving(true);
    try {
      await handleSaveDraft();

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
          alert('Failed to initialize flow.');
          return;
        }
        currentFlow = initializedFlow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize flow';
        alert(errorMessage);
        return;
      }
    }

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
        const result = await response.json();
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
        const error = await response.json();
        alert(error.error || 'Failed to delete node');
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      alert('Failed to delete node');
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-secondary">Loading flow builder...</div>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 glass-surface rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 text-sm border border-white/5"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2 glass-surface rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50 text-sm border border-white/5"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all flex items-center gap-2 disabled:opacity-50 text-sm shadow-prestige-soft border border-accent/30"
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
          className="flex-1 relative bg-charcoal" 
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
              setPreviewMode('preview');
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
              // FIX: Use enum instead of string literal
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              className="glass-surface border border-white/10"
              style={{ 
                button: { 
                  backgroundColor: 'rgba(30, 30, 30, 0.95)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#e5e5e5',
                },
                'button:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
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

        {/* Right Panel - Preview or Settings */}
        <div className="w-96 glass-border-l flex flex-col flex-shrink-0 bg-charcoal">
          {selectedNode ? (
            <>
              {/* Toggle between Preview and Settings */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                    previewMode === 'preview'
                      ? 'text-primary border-b-2 border-accent bg-white/5'
                      : 'text-secondary hover:text-primary hover:bg-white/5'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setPreviewMode('settings')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                    previewMode === 'settings'
                      ? 'text-primary border-b-2 border-accent bg-white/5'
                      : 'text-secondary hover:text-primary hover:bg-white/5'
                  }`}
                >
                  Settings
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {previewMode === 'preview' ? (
                  <div className="p-6">
                    <StepPreview
                      node={{
                        ...selectedNode.data,
                        config: selectedNode.data.config || {},
                      }}
                      orgName={orgName}
                      onEdit={() => setPreviewMode('settings')}
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <NodeSettingsPanel
                      node={selectedNode}
                      orgId={orgId}
                      clerkOrgId={clerkOrgId}
                      onUpdate={async (updatedNodeData?: any) => {
                        // If we have the updated node data from the save response, use it directly
                        if (updatedNodeData) {
                          console.log('Updating node from save response:', updatedNodeData);
                          setNodes((currentNodes) => {
                            const newNodes = currentNodes.map((n) => {
                              if (n.id === selectedNode.id) {
                                const updatedNode = {
                                  ...n,
                                  data: {
                                    ...n.data,
                                    config: updatedNodeData.config || {},
                                    title: updatedNodeData.title,
                                    description: updatedNodeData.description,
                                  },
                                };
                                console.log('Updated node data:', updatedNode.data);
                                setSelectedNode(updatedNode);
                                return updatedNode;
                              }
                              return n;
                            });
                            return newNodes;
                          });
                        } else {
                          // Fallback: try to reload just this node
                          try {
                            const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes?flowId=${flow?.id}`);
                            if (response.ok) {
                              const result = await response.json();
                              if (result.data) {
                                const updatedNode = result.data.find((n: any) => n.id === selectedNode.id);
                                if (updatedNode) {
                                  setNodes((currentNodes) => {
                                    const newNodes = currentNodes.map((n) => {
                                      if (n.id === selectedNode.id) {
                                        return {
                                          ...n,
                                          data: {
                                            ...n.data,
                                            config: updatedNode.config || {},
                                            title: updatedNode.title,
                                            description: updatedNode.description,
                                          },
                                        };
                                      }
                                      return n;
                                    });
                                    const updatedSelectedNode = newNodes.find(n => n.id === selectedNode.id);
                                    if (updatedSelectedNode) {
                                      setSelectedNode(updatedSelectedNode);
                                    }
                                    return newNodes;
                                  });
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error refreshing node:', error);
                          }
                        }
                        setPreviewMode('preview');
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-secondary text-sm text-center py-8 px-4">
                Select a node to preview it
              </div>
            </div>
          )}
        </div>
      </div>

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