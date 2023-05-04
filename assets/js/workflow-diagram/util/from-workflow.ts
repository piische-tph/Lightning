import layout from '../layout';
import { Node, Edge, Workflow } from '../types';

const fromWorkflow = (workflow: Workflow, selection: Record<string, true>) => {
  if (workflow.jobs.length == 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = [] as any[];
  const edges = [] as any[];

  process(workflow.jobs, nodes, 'job');
  process(workflow.triggers, nodes, 'trigger');
  process(workflow.edges, edges, 'edge');
  // console.log(nodes);
  // console.log(edges);
  try {
    return layout({ nodes, edges });
  } catch (e) {
    // Common use case right now is to try and layout an inconsistent chart
    // This will keep me alive until I can fix it
    console.error(e);
    return { nodes, edges };
  }
};

export default fromWorkflow;

const process = (
  items: Array<Node | Edge>,
  collection: any[],
  type: 'job' | 'trigger' | 'edge'
) => {
  items.forEach(item => {
    const model: any = {
      id: item.id,
    };
    if (/(job|trigger)/.test(type)) {
      model.type = type;
    } else {
      let edge = item as Edge;
      model.source = edge.source_trigger_id || edge.source_job_id;
      model.target = edge.target_job_id;
      model.label = item.label;
      model.labelBgStyle = {
        fill: 'rgb(243, 244, 246)',
      };
    }

    model.data = {
      ...item,
      label: item.label || item.id,
      // TMP
      trigger: {
        type: 'webhook',
      },
    };
    collection.push(model);
  });
};

// TODO pass in the currently selected items so that we can maintain selection
