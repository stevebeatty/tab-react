/**
 * Defines sizes that are used for laying out the display.  In 'em's
 */
class Layout {
    topStringOffset() {
        return 0.75;
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