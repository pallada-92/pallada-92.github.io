//--------------------------------------------------------------------

class App {
    canvas: Canvas;
    private_graph: PrivateGraph;
    timeline: Timeline;
    layoutA: Layout;
    constructor() {
        this.canvas = new Canvas();
        this.timeline = new Timeline();
        this.private_graph = new PrivateGraph(this.timeline);
        this.private_graph.bg_alpha = 0.1;
        this.timeline.graph = this.private_graph;
        this.layoutA = new Layouts.Layout5(
            this.canvas,
            this.private_graph.component,
            new TestComponent(), 0,
            new TestComponent(), 0,
            this.timeline.component, 100,
            new TestComponent(), 0,
        );
    }
    onkeydown(evt: KeyboardEvent) {
        console.log(evt.key);
        if ('0123456789'.indexOf(evt.key) != -1) {
            this.private_graph.bg_alpha = +('0.' + evt.key);
            this.canvas.draw();
        }
    }
    onload() {
        this.private_graph.load_vertex_pos();
        this.canvas.create();
        this.canvas.layout = this.layoutA;
        this.canvas.change_layout();
        this.private_graph.start_loading();
        document.title = 'Анализ коммуникаций';
    }
    mount() {
        window.addEventListener('load', this.onload.bind(this));
        window.addEventListener('keydown', this.onkeydown.bind(this));
    }
}

