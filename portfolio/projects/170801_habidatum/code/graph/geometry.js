var Geom;
(function (Geom) {
    function inside_rect(pt, rect) {
        if (pt[0] < rect[0])
            return false;
        if (pt[1] < rect[1])
            return false;
        if (pt[0] > rect[0] + rect[2])
            return false;
        if (pt[1] > rect[1] + rect[3])
            return false;
        return true;
    }
    Geom.inside_rect = inside_rect;
    function dist_sq(pt1, pt2) {
        var dx = pt2[0] - pt1[0], dy = pt2[1] - pt1[1];
        return dx * dx + dy * dy;
    }
    Geom.dist_sq = dist_sq;
    function inside_circ(pt, circ) {
        var dist = dist_sq(pt, circ);
        return dist <= circ[2] * circ[2];
    }
    Geom.inside_circ = inside_circ;
    function add(pt1, pt2) {
        return [
            pt1[0] + pt2[0],
            pt1[1] + pt2[1],
        ];
    }
    Geom.add = add;
    function vec(pt1, pt2) {
        return [
            pt2[0] - pt1[0],
            pt2[1] - pt1[1],
        ];
    }
    Geom.vec = vec;
    function mul(coeff, pt) {
        return [coeff * pt[0], coeff * pt[1]];
    }
    Geom.mul = mul;
    function norm(vec) {
        return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
    }
    Geom.norm = norm;
    function normed(vec) {
        var len = norm(vec);
        return [vec[0] / len, vec[1] / len];
    }
    Geom.normed = normed;
    function ort_unit(vec) {
        return normed([-vec[1], vec[0]]);
    }
    Geom.ort_unit = ort_unit;
    function circ_vertex_pos(num, center, radius) {
        var res = [];
        for (var i = 0; i < num; i++) {
            var a = i / num * 2 * Math.PI;
            res.push([
                center[0] + radius * Math.cos(a),
                center[1] + radius * Math.sin(a),
            ]);
        }
        return res;
    }
    Geom.circ_vertex_pos = circ_vertex_pos;
})(Geom || (Geom = {}));
