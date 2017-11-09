function assert(val: boolean, msg: string) {
    if (!val) {
        throw Error(msg);
    }
}

function assertEq(val1: any, val2: any, msg: string) {
    const val1str = JSON.stringify(val1),
        val2str = JSON.stringify(val2);
    assert(
        val1str == val2str,
        msg + ': ' + val1str + ' != ' + val2str,
    );
}

function check_max(val, obj, msg) {
    const name = obj.constructor.name;
    let min_val = 0, max_val, is_int = true;
    if (name == 'Uint32Array') {
        max_val = 4294967295;
    } else if (name == 'Uint16Array') {
        max_val = 65535;
    } else if (name == 'Uint8Array') {
        max_val = 255;
    } else {
        throw 'Unknown check_max type: ' + name;
    }
    if (typeof val == 'object') {
        for (let i = 0; i < val.length; i++) {
            const cur_val = val[i];
            if (cur_val < min_val || max_val < cur_val) {
                throw Error(
                    'Array values out of bounds: ' +
                    msg + ' [' + i + '] = ' + cur_val + ' > ' + max_val
                );
            }
        }
    } else if (typeof val == 'number') {
        if (val < min_val || max_val < val) {
            throw Error(
                'Value out of bounds: ' +
                msg + ', ' + val + ' > ' + max_val
            );
        }
    }
}

class DataObj {

    constructor(
        public data_path: string,
        public on_data_loaded: () => void,
    ) { };

    priv_on_data_loaded(text: string) {

    }

    start_loading_data() {
        let req = new XMLHttpRequest();
        const this1 = this;
        req.addEventListener('load', function () {
            this1.priv_on_data_loaded(this.responseText);
            this1.on_data_loaded();
        });
        req.open('GET', this.data_path);
        req.send();
    }

}

class StringPool {

    starts: Uint32Array;
    lengths: Uint16Array;
    pool: Uint8Array;
    chars_stats: { [char: string]: number } = {};
    smallchars: string;
    smallchars_dict: { [char: string]: number } = {};

    constructor(
        strings: string[],
    ) {
        this.calc_smallchars(strings);
        this.starts = new Uint32Array(strings.length);
        this.lengths = new Uint16Array(strings.length);
        let pool_pos = 0;
        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            let str_size = 0;
            this.starts[i] = pool_pos;
            for (let j = 0; j < str.length; j++) {
                const ch = str[j];
                if (ch in this.smallchars_dict) {
                    str_size += 1;
                } else {
                    str_size += 3;
                }
            }
            assert(str_size < 256 * 256, 'String size >= 16 bit');
            this.lengths[i] = str_size;
            pool_pos += str_size;
        }
        this.pool = new Uint8Array(pool_pos);
        pool_pos = 0;
        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            for (let j = 0; j < str.length; j++) {
                const ch = str[j];
                if (ch in this.smallchars_dict) {
                    this.pool[pool_pos] = this.smallchars_dict[ch];
                    pool_pos++;
                } else {
                    const chcode = str.charCodeAt(j);
                    this.pool[pool_pos] = 255;
                    pool_pos++;
                    this.pool[pool_pos] = chcode & 255;
                    pool_pos++;
                    this.pool[pool_pos] = chcode >> 8;
                    pool_pos++;
                }
            }
        }
    }

    calc_smallchars(strings: string[]) {
        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            for (let j = 0; j < str.length; j++) {
                const ch = str[j];
                if (ch in this.chars_stats) {
                    this.chars_stats[ch]++;
                } else {
                    this.chars_stats[ch] = 1;
                }
            }
        }
        let for_sort: [number, string][] = [];
        for (let char in this.chars_stats) {
            let count = this.chars_stats[char];
            for_sort.push([count, char]);
        }
        for_sort.sort((a, b) => b[0] - a[0]);
        this.smallchars = '';
        for (let i = 0; i < for_sort.length; i++) {
            if (i >= 255) break;
            const ch = for_sort[i][1];
            this.smallchars += ch;
            this.smallchars_dict[ch] = i;
        }
    }

    get_label(index: number) {
        const start = this.starts[index],
            end = start + this.lengths[index];
        let res = '',
            i = start;
        while (i < end) {
            let chcode = this.pool[i];
            i++;
            if (chcode == 255) {
                chcode = this.pool[i];
                i++;
                chcode += this.pool[i] * 256;
                i++;
                res += String.fromCharCode(chcode);
            } else {
                res += this.smallchars[chcode];
            }
        }
        return res;
    }

}

class BitArray {

    bytes: Uint8Array;

    constructor(
        public size: number,
    ) {
        this.bytes = new Uint8Array(Math.ceil(size / 8));
    }

    set_at(index: number, value: boolean) {
        const shift = index % 8,
            mask = 1 << shift,
            pos = (index - shift) / 8;
        if (value) {
            this.bytes[pos] = this.bytes[pos] | mask;
        } else {
            this.bytes[pos] = this.bytes[pos] & ~mask;
        }
    }

    get_at(index: number): boolean {
        const shift = index % 8,
            mask = 1 << shift,
            pos = (index - shift) / 8;
        return (this.bytes[pos] & mask) != 0;
    }

}

class Graph extends DataObj {

    node_count: number;
    edge_count: number;
    values_order: string[];
    total_values: number[];
    values: Uint16Array;
    edges: Uint16Array;
    coords: Float32Array;
    labels: StringPool;

    priv_on_data_loaded(text: string) {
        let data = JSON.parse(text);
        this.node_count = data.node_count;
        this.edge_count = data.edges.length / 3;
        this.values_order = data.values_order;
        this.total_values = data.total_values;
        this.values = new Uint16Array(data.values);
        check_max(data.values, this.values, 'data.values');
        this.edges = new Uint16Array(data.edges);
        check_max(data.edges, this.edges, 'data.edges');
        this.coords = new Float32Array(data.coords);
        this.labels = new StringPool(data.labels);
    }

}

let count_sort_global_cache = new Uint32Array(256 * 256);

function count_sort(
    arr, res_arr,
    item_count: number, item_size: number, shift_in_item: number,
    write_index: boolean = false
) {
    let max_val = -1;
    for (let i = 0; i < item_count; i++) {
        const val = arr[i * item_size + shift_in_item];
        assert(
            val < count_sort_global_cache.length,
            'val >= count_sort_global_cache.length',
        );
        if (max_val < val) {
            for (let i = max_val + 1; i <= val; i++) {
                count_sort_global_cache[i] = 0;
            }
            max_val = val;
        }
        count_sort_global_cache[val]++;
    }
    let accum = 0;
    for (let i = 0; i <= max_val; i++) {
        const cur_count = count_sort_global_cache[i];
        count_sort_global_cache[i] = accum;
        accum += cur_count;
    }
    if (write_index) {
        for (let i = 0; i < item_count; i++) {
            const val = arr[i * item_size + shift_in_item],
                write_ix = count_sort_global_cache[val];
            res_arr[write_ix] = i;
            count_sort_global_cache[val]++;
        }
    } else {
        for (let i = 0; i < item_count; i++) {
            const val = arr[i * item_size + shift_in_item],
                write_ix = count_sort_global_cache[val];
            for (let j = 0; j < item_size; j++) {
                res_arr[write_ix * item_size + j] =
                    arr[i * item_size + j];
            }
            count_sort_global_cache[val]++;
        }
    }
}

function subarray(arr, res_arr, item_count, item_size, subitems) {
    const sl = subitems.length;
    for (let i = 0; i < sl; i++) {
        const idx = subitems[i];
        if (idx == null) continue;
        for (let j = 0; j < item_count; j++) {
            res_arr[j * sl + i] = arr[j * item_size + idx];
        }
    }
}

function bin_search(arr, item_count, item_size, shift_in_item, el) {
    let m = 0,
        n = item_count - 1;
    while (m <= n) {
        const k = (n + m) >> 1,
            cur = arr[k * item_size + shift_in_item],
            cmp = el - cur;
        if (cur < el) {
            m = k + 1;
        } else if (el < cur) {
            n = k - 1;
        } else {
            if (k == 0) return k;
            const prev = arr[(k - 1) * item_size + shift_in_item];
            if (prev == cur) {
                n = k - 1;
            } else {
                return k;
            }
        }
    }
    return - m - 1;
}

class AscSegments {

    indices: Uint32Array;
    values: any;
    len: number;
    max_val: number;

    constructor(arr, ValType, item_count, item_size, shift_in_item) {
        this.len = item_count;
        if (this.len == 0) return;
        this.max_val = arr[(item_count - 1) * item_size + shift_in_item];
        let seg_count = 0,
            prev = null;
        for (let i = 0; i < item_count; i++) {
            const cur = arr[i * item_size + shift_in_item];
            if (prev !== cur) seg_count++;
            prev = cur;
        }
        this.indices = new Uint32Array(seg_count);
        this.values = new ValType(seg_count);
        let cur_segment = 0;
        for (let i = 0; i < item_count; i++) {
            const cur = arr[i * item_size + shift_in_item];
            if (prev !== cur) {
                this.indices[cur_segment] = i;
                this.values[cur_segment] = cur;
                cur_segment++;
                prev = cur;
            }
        }
    }

    get_at(index: number) {
        assert(index < this.len, 'Index out of bounds');
        assert(index >= this.indices[0], 'Index out of bounds');
        const idx = bin_search(
            this.indices,
            this.indices.length,
            1, 0, index
        );
        if (idx < 0) {
            return this.values[-idx - 2];
        } else {
            return this.values[idx];
        }
    }

    iter_segments(fun: (start, end, val) => void) {
        if (this.len == 0) return;
        let prev_start = this.indices[0],
            prev_val = this.values[0];
        for (let i = 1; i < this.indices.length; i++) {
            const cur_start = this.indices[i];
            fun(prev_start, cur_start, prev_val);
            prev_start = cur_start;
            prev_val = this.values[i];
        }
        fun(prev_start, this.len, prev_val);
    }

    find_val_segment(val: number) {
        const idx = bin_search(
            this.values,
            this.values.length,
            1, 0, val
        );
        if (idx < 0) {
            if (-idx - 1 >= this.values.length) {
                return [this.len, this.len];
            }
            const id = this.indices[- idx - 1];
            return [id, id];
        } else {
            if (idx == this.values.length - 1) {
                return [this.indices[idx], this.len];
            }
            return [this.indices[idx], this.indices[idx + 1]];
        }
    }

}

function record_funcs_test() {

    let arr: number[] = [0, 1, 4, 3, 2, 7, 6, 5],
        res: number[] = [];
    count_sort(arr, res, 4, 2, 0);
    assertEq(res, [0, 1, 2, 7, 4, 3, 6, 5], 't1');
    count_sort(arr, res, 4, 2, 1);
    assertEq(res, [0, 1, 4, 3, 6, 5, 2, 7], 't2');
    count_sort(arr, res, 3, 2, 1);
    assertEq(res, [0, 1, 4, 3, 2, 7, 2, 7], 't2.1');
    arr = [1, 3, 1, 2, 0, 2, 0, 1];
    count_sort(arr, res, 4, 2, 0);
    assertEq(res, [0, 2, 0, 1, 1, 3, 1, 2], 't3');
    count_sort(arr, res, 4, 2, 1);
    assertEq(res, [0, 1, 1, 2, 0, 2, 1, 3], 't4');
    arr = [3, 1, 2];
    count_sort(arr, res, 3, 1, 0);
    assertEq(res, [1, 2, 3, 2, 0, 2, 1, 3], 't5');
    count_sort(arr, res, 2, 1, 0);
    assertEq(res, [1, 3, 3, 2, 0, 2, 1, 3], 't6');
    arr = [0, 1, 4, 3, 2, 7, 6, 5];
    res = [];
    count_sort(arr, res, 4, 2, 0, true);
    assertEq(res, [0, 2, 1, 3], 't6.1');
    count_sort(arr, res, 4, 2, 1, true);
    assertEq(res, [0, 1, 3, 2], 't6.2');
    count_sort(arr, res, 8, 1, 0, true);
    assertEq(res, [0, 1, 4, 3, 2, 7, 6, 5], 't6.3');

    res = [1, 3, 3, 2, 0, 2, 1, 3];
    arr = [0, 1, 4, 3, 2, 7, 6, 5];
    subarray(arr, res, 4, 2, []);
    assertEq(res, [1, 3, 3, 2, 0, 2, 1, 3], 't7');
    subarray(arr, res, 4, 2, [1]);
    assertEq(res, [1, 3, 7, 5, 0, 2, 1, 3], 't8');
    subarray(arr, res, 3, 2, [0]);
    assertEq(res, [0, 4, 2, 5, 0, 2, 1, 3], 't9');
    subarray(arr, res, 3, 2, [0, 1]);
    assertEq(res, [0, 1, 4, 3, 2, 7, 1, 3], 't10');
    subarray(arr, res, 4, 2, [null]);
    assertEq(res, [0, 1, 4, 3, 2, 7, 1, 3], 't10.1');
    subarray(arr, res, 4, 2, [null, 0]);
    assertEq(res, [0, 0, 4, 4, 2, 2, 1, 6], 't10.2');
    subarray(arr, res, 3, 2, [1, null]);
    assertEq(res, [1, 0, 3, 4, 7, 2, 1, 6], 't10.3');

    arr = [0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 5, 10];
    assertEq(bin_search(arr, 13, 1, 0, 0), 0, 't11');
    assertEq(bin_search(arr, 13, 1, 0, 1), 2, 't12');
    assertEq(bin_search(arr, 13, 1, 0, 2), 5, 't13');
    assertEq(bin_search(arr, 13, 1, 0, 3), 9, 't14');
    assertEq(bin_search(arr, 13, 1, 0, 4), -12, 't15');
    assertEq(bin_search(arr, 13, 1, 0, 5), 11, 't16');
    assertEq(bin_search(arr, 13, 1, 0, 6), -13, 't17');
    assertEq(bin_search(arr, 13, 1, 0, 10), 12, 't18');

    arr = [0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 5, 10];
    let segments = new AscSegments(arr, Uint8Array, arr.length, 1, 0);
    assertEq(segments.len, arr.length, 't19');
    assertEq(segments.max_val, 10, 't20');
    assertEq(segments.get_at(0), 0, 't21');
    assertEq(segments.get_at(1), 0, 't22');
    assertEq(segments.get_at(2), 1, 't23');
    assertEq(segments.get_at(11), 5, 't24');
    assertEq(segments.get_at(12), 10, 't25');
    assertEq(segments.find_val_segment(-1), [0, 0], 't26');
    assertEq(segments.find_val_segment(0), [0, 2], 't26');
    assertEq(segments.find_val_segment(0.5), [2, 2], 't26.1');
    assertEq(segments.find_val_segment(1), [2, 5], 't27');
    assertEq(segments.find_val_segment(2), [5, 9], 't28');
    assertEq(segments.find_val_segment(3), [9, 11], 't29');
    assertEq(segments.find_val_segment(4), [11, 11], 't30');
    assertEq(segments.find_val_segment(5), [11, 12], 't31');
    assertEq(segments.find_val_segment(6), [12, 12], 't32');
    assertEq(segments.find_val_segment(10), [12, 13], 't33');
    assertEq(segments.find_val_segment(11), [13, 13], 't34');
    assertEq(segments.find_val_segment(Infinity), [13, 13], 't35');

    console.log('tests passed');

}

record_funcs_test();

class Subgraph {

    node_count: number;
    edge_count: number;
    edges: Uint16Array;
    weights: AscSegments;
    selected_vertices: BitArray;
    z12: Float32Array;
    top_values: Uint16Array;

    constructor(
        public graph: Graph,
    ) {
        this.edges = new Uint16Array(graph.edge_count * 2);
        let temp = new Uint16Array(graph.edge_count * 3);
        count_sort(graph.edges, temp, graph.edge_count, 3, 2);
        subarray(temp, this.edges, graph.edge_count, 3, [0, 1]);
        this.weights = new AscSegments(
            temp, Uint16Array, graph.edge_count, 3, 2);
        this.selected_vertices = new BitArray(graph.node_count);
        this.node_count = 0;
        this.edge_count = 0;
    };

    set_top_values(val_name: string) {
        const idx = this.graph.values_order.indexOf(val_name);
        this.top_values = new Uint16Array(this.graph.node_count);
        count_sort(
            this.graph.values, this.top_values,
            this.graph.node_count,
            this.graph.values_order.length,
            idx,
            true,
        );
    }

    set_weight_groups(ranges: { weight_range: [number, number] }[]) {
        for (let i = 0; i < ranges.length; i++) {
            const wr = ranges[i].weight_range;
            ranges[i]['edges_ids_range'] = [
                this.weights.find_val_segment(wr[0])[0],
                this.weights.find_val_segment(wr[1])[1],
            ];
        }
    }

    set_z12(val1: string, val2: string) {
        this.z12 = new Float32Array(this.graph.node_count * 2);
        const ix1 = this.graph.values_order.indexOf(val1),
            ix2 = this.graph.values_order.indexOf(val2),
            val_count = this.graph.values_order.length,
            vals = this.graph.values;
        for (let i = 0; i < this.graph.node_count; i++) {
            this.z12[i * 2] =
                (Math.log(1 + vals[i * val_count + ix1]) - 7) * 50;
            this.z12[i * 2 + 1] =
                (Math.log(1 + vals[i * val_count + ix2]) - 7) * 50;
        }
    }

}

