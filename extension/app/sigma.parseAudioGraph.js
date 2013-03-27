sigma.publicPrototype.parseAudioGraph = function(pData) {

    alert('parseAudioGraph called!');
    var sigmaInstance = this;
    var tSourceList = pData.source;
    var tIntermediateList = pData.intermediate;
    var tColor = '#ff6600';

    var addSigmaNode = function (pAudioNode) {
      var tSigmaNode = {label: pAudioNode.type + '(id=' + pAudioNode.id + ')', color: tColor};
      alert('addSigmaNode: ' + tSigmaNode.lable);
      sigmaInstance.addNode(pAudioNode.id + '', tSigmaNode);
    };

    var doTraverseAudioGraph = function (pNode) {
      alert('doTraverseAudioGraph called!');
      var tQueue = [];
      addSigmaNode(pNode.node);
      pNode.visited = true;
      tQueue.push(pNode);
      while (var tNode = tQueue.shift()) {
        var tDownstream = tNode.node.downstream;
        for (var i = 0, il = tDownstream.length; i < il; i++) {
          tNode = tDownstream[i];
          if (!tNode.visited) {
            addSigmaNode(tNode.node);
            tNode.visited = true;
            tQueue.push(tNode);
          }
        }
      }
    };

    for (var i = 0, il = tSourceList.length; i < il; i++) {
      var tSourceNode = tSourceList[i];
      doTraverseAudioGraph.call(this, tSourceNode);
    }
/*
  var edges = [];
  var edgeId = 0;
  for(i=0; i<edgesNodes.length; i++){
      var edge = {
        id:         j,
        sourceID:   source,
        targetID:   target,
        label:      label,
        attributes: []
      };

      var weight = edgeNode.getAttribute('weight');
      if(weight!=undefined){
        edge['weight'] = weight;
      }

      for(k=0; k<attvalueNodes.length; k++){
        edge.attributes.push({attr:attr, val:val});
      }

      sigmaInstance.addEdge(edgeId++,source,target,edge);
    }
    */
};
