import React, { useMemo, useCallback, useState, useEffect } from 'react';
import ReactFlow, { Node, ReactFlowProvider, applyEdgeChanges, applyNodeChanges } from 'react-flow-renderer';
import layout from './layout'
import nodeTypes from './types';

type WorkflowDiagramProps = {
  workflow: Workflow;
  onNodeSelected: (id: string) => void;
}

interface Node {
  id: string;
  name: string,
  workflowId: string;

}

interface Trigger extends Node {
  // TODO trigger type data
}

interface Job extends Node {
  
}

interface Edge {
  id: string;
  condition: string;
  source_job?: string;
  source_trigger?: string;
  target_job?: string;
}

type Workflow = {
  id: string;
  changeId?: string;
  triggers: Trigger[],
  jobs: Job[],
  edges: Edge[],
};


const convertWorkflow  = (workflow: Workflow) => {
  const nodes = [] as any[];
  const edges = [] as any[];


  const process = (items: any[], collection: any[], type: 'job' | 'trigger' | 'edge') => {
    items.forEach((item) => {
      const model = {
        id: item.id
      }
      if (/(job|trigger)/.test(type)) {
        model.type = type;
      } else {
        model.source = item.source_trigger || item.source_job;
        model.target = item.target_job;
      }

      model.data = {
        ...item,
        label: item.id,
        // TMP
        trigger:  {
          type: 'webhook'
        },
      }
      collection.push(model)
    });
  };

  process(workflow.jobs, nodes, 'job')
  process(workflow.triggers, nodes, 'trigger')
  process(workflow.edges, edges, 'edge')

  return layout({ nodes, edges })
};

// Not sure on the relationship to the store
// I kinda just want the component to do visalusation and fir eevents
// Does it even know about zustand? Any benefit?

// So in controlled mode things get difficult
// the component has to track internal chart state, like selection,
// as well as incoming changes from the server (like node state change)
export default ({ workflow, onSelectionChange }: WorkflowDiagramProps) => {
  const [model, setModel] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState({ nodes: {}, edges: {} });

  // respond to changes pushed into the component
  // For now this just means the job has changed
  // but later it might mean syncing back with the server
  // TODO at the moment the parent app is forcing a re-render here each time
  useEffect(() => {
    console.log('UPDATING MODEL')
    const data = convertWorkflow(workflow);
    setModel(data)
  }, [workflow])

  const onNodesChange = useCallback(
    (changes) => {
      const newNodes = applyNodeChanges(changes, model.nodes);
      console.log(newNodes)
      setModel({ nodes: newNodes, links: model.links });
    }, [setModel, model]);

  // const onEdgesChange = useCallback(
  //   (changes) => setModel((eds) => {
  //     const newLinks = applyEdgeChanges(changes, eds)
  //     setModel({ links: newLinks, nodes: model.nodes })
  //   },
  //   [setModel]
  // );

  const handleSelectionChange = useCallback(({ nodes, edges }) => {
    const everything = nodes.concat(edges);
    const selection = everything.map(({ id }) => id);
    onSelectionChange(selection);
  }, [onSelectionChange]);

  return <ReactFlowProvider>
      <ReactFlow
        proOptions={{ account: 'paid-pro', hideAttribution: true }}
        nodes={model.nodes}
        edges={model.edges}
        onSelectionChange={handleSelectionChange}
        onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        // // onSelectionChange={onSelectedNodeChange}
        // // onConnect={onConnect}
        // // If we let folks drag, we have to save new visual configuration...
        nodesDraggable={false}
        // // No interaction for this yet...
        // nodesConnectable={false}
        nodeTypes={nodeTypes}
        // snapToGrid={true}
        // snapGrid={[10, 10]}
        // onNodeClick={handleNodeClick}
        // onPaneClick={onPaneClick}
        // onInit={Store.setReactFlowInstance}
        fitView
      />
    </ReactFlowProvider>
}