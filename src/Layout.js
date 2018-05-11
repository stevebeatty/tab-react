class Layout {
    topStringOffset() {
        return 1;
    }
    noteRadius() {
        return 0.6;
    }
    stringSpacing() {
        return this.noteRadius() * 2;
    }
    subdivisionOffset() {
        return this.noteRadius() * 2.5;
    }
    noteTextOffset() {
        return 0.3;
    }
    measureSideOffset() {
        return 1;
    }
    stringClickBoxHeight() {
        return 0.4 * this.stringSpacing();
    }
    measureClickBoxWidth() {
        return 0.6;
    }
};

export default Layout;