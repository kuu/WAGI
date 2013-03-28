sigma.publicPrototype.parseAudioGraph = function(pData) {

    //alert('parseAudioGraph called! : source.len=' + pData.source.length + ', intermediate.len=' + pData.intermediate.length);
    var tSigmaInstance = this;
    var tSourceList = pData.source;
    var tIntermediateList = pData.intermediate;
    var tColor = '#ff6600';

    var addSigmaNode = function (pAudioNode) {
      var tSigmaNode = {label: (pAudioNode.type + '(id=' + pAudioNode.id + ')'), color: tColor};
      alert('addSigmaNode: ' + tSigmaNode.label);
      tSigmaInstance.addNode(pAudioNode.id + '', tSigmaNode);
    };

    var doTraverseAudioGraph = function (pNode) {
      //alert('doTraverseAudioGraph called!');
      var tQueue = [], tNode;
      addSigmaNode(pNode.node);
      pNode.visited = true;
      tQueue.push(pNode);
      while ((tNode = tQueue.shift()) !== null) {
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
      doTraverseAudioGraph(tSourceList[i]);
    }
    for (var i = 0, il = tIntermediateList.length; i < il; i++) {
      doTraverseAudioGraph(tIntermediateList[i]);
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

      tSigmaInstance.addEdge(edgeId++,source,target,edge);
    }
    */
};
