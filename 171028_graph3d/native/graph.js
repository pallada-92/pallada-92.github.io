function make_graph() {
    var vertices = [], edges = [], degrees = [], vertex_count = 1000, edge_count = vertex_count / 2 * 10, range = 1000;
    while (vertex_count > 0) {
        var pos = new THREE.Vector3((2 * Math.random() - 1) * range, (2 * Math.random() - 1) * range, (2 * Math.random() - 1) * range);
        var prop = pos.length() / range;
        if (prop > 1)
            continue;
        if (prop > 0.5) {
            var prob = (prop - 0.5) / 0.5;
            if (Math.random() > prob) {
                continue;
            }
        }
        vertices.push(pos);
        degrees.push(0);
        vertex_count--;
    }
    while (edge_count > 0) {
        var v1i = Math.floor(Math.random() * vertices.length), v2i = Math.floor(Math.random() * vertices.length), v1 = vertices[v1i], v2 = vertices[v2i], dist = v1.distanceTo(v2), prop = dist / range, prob = Math.pow(prop, 0.1);
        if (Math.random() < prob)
            continue;
        edges.push([v1i, v2i]);
        edge_count--;
        degrees[v1i]++;
        degrees[v2i]++;
    }
    for (var i = 0; i < vertices.length; i++) {
        if (degrees[i] <= 0) {
            vertices[i] = null;
        }
    }
    for (var i = 0; i < edges.length; i++) {
        if (vertices[edges[i][0]] === null ||
            vertices[edges[i][1]] === null) {
            edges[i] = null;
        }
    }
    return {
        vertices: vertices,
        edges: edges,
    };
}
