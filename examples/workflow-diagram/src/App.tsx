import React from 'react';

// Is this right? Appropriate?
// Doesn't work because I can't import out of source
// import WorkflowDiagram from '../../../assets/js/workflow-diagram/src/test'

import './main.css'

export default () => {
  console.log(React.version)
  return (<div className="flex flex-row h-full">
    <div className="flex-grow border-2 border-slate-200 m-2 ">
      {/* <WorkflowDiagram  /> */}
    </div>
    <div className="flex flex-col h-full w-1/3">
      <div className="flex-grow border-2 border-slate-200 m-2">Drill down</div>
      <div className="flex-grow border-2 border-slate-200 m-2">Changes</div>
    </div>
  </div>
  );
};

/*
  I think the app needs to create the store and pass it in

  How do I get tailwind in here?


  How do I import the workflow diagram styles properly?

*/