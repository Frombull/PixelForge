export class ColorPickerUI {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.colorPicker = null;
        this.isUpdating = false;
        this.currentMode = 'rgb';
        
        this.inputs = {
            r: document.getElementById('color-r'),
            g: document.getElementById('color-g'),
            b: document.getElementById('color-b'),
            h: document.getElementById('color-h'),
            s: document.getElementById('color-s'),
            v: document.getElementById('color-v'),
            alpha: document.getElementById('color-alpha'),
            alphaValue: document.getElementById('alpha-value'),
            hex: document.getElementById('color-hex')
        };
        
        this.init();
    }
    
    init() {
        this.colorPicker = new iro.ColorPicker('#color-picker-container', {
            width: 180,
            color: '#ffffff',
            borderWidth: 1,
            borderColor: '#444',
            padding: 0,
            layout: [
                { component: iro.ui.Box },
                { component: iro.ui.Slider, options: { sliderType: 'hue' } }
            ]
        });
        
        this.colorPicker.on('color:change', (color) => {
            if (this.isUpdating) return;
            this.updateInputs(color);
            this.applyColor(color);
        });
        
        this.setupCollapsible();
        this.setupTabs();
        this.setupListeners();
    }
    
    setupCollapsible() {
        const header = document.getElementById('color-header');
        const section = document.getElementById('color-section');
        
        header?.addEventListener('click', () => {
            const expanded = section.classList.contains('expanded');
            section.classList.toggle('expanded', !expanded);
            section.classList.toggle('collapsed', expanded);
            header.classList.toggle('open', !expanded);
        });
    }
    
    setupTabs() {
        document.querySelectorAll('.color-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentMode = tab.dataset.mode;
                document.querySelectorAll('.color-tab').forEach(t => 
                    t.classList.toggle('active', t.dataset.mode === this.currentMode)
                );
                document.getElementById('rgb-inputs').style.display = 
                    this.currentMode === 'rgb' ? 'block' : 'none';
                document.getElementById('hsv-inputs').style.display = 
                    this.currentMode === 'hsv' ? 'block' : 'none';
            });
        });
    }
    
    setupListeners() {
        const { r, g, b, h, s, v, alpha, hex } = this.inputs;
        
        [r, g, b].forEach(i => {
            i.addEventListener('change', () => this.onRGBChange());
            i.addEventListener('keydown', e => e.key === 'Enter' && this.onRGBChange());
        });
        
        [h, s, v].forEach(i => {
            i.addEventListener('change', () => this.onHSVChange());
            i.addEventListener('keydown', e => e.key === 'Enter' && this.onHSVChange());
        });
        
        alpha.addEventListener('input', () => this.onAlphaChange());
        hex.addEventListener('change', () => this.onHexChange());
        hex.addEventListener('keydown', e => e.key === 'Enter' && this.onHexChange());
    }
    
    updateInputs(color) {
        this.isUpdating = true;
        
        this.inputs.r.value = color.rgb.r;
        this.inputs.g.value = color.rgb.g;
        this.inputs.b.value = color.rgb.b;
        
        this.inputs.h.value = Math.round(color.hsv.h);
        this.inputs.s.value = Math.round(color.hsv.s);
        this.inputs.v.value = Math.round(color.hsv.v);
        
        this.inputs.hex.value = color.hexString;
        
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    updateFromObject() {
        const obj = this.objectManager.selectedObject;
        if (!obj?.material) return;
        
        this.isUpdating = true;
        
        const hex = '#' + obj.material.color.getHexString();
        this.colorPicker.color.hexString = hex;
        
        const alpha = Math.round((obj.material.opacity || 1) * 100);
        this.inputs.alpha.value = alpha;
        this.inputs.alphaValue.textContent = alpha + '%';
        
        this.updateInputs(this.colorPicker.color);
        
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    applyColor(color) {
        const obj = this.objectManager.selectedObject;
        if (!obj?.material) return;
        
        const alpha = parseInt(this.inputs.alpha.value) / 100;
        obj.material.color.setHex(parseInt(color.hexString.substring(1), 16));
        obj.material.transparent = alpha < 1;
        obj.material.opacity = alpha;
        obj.material.needsUpdate = true;
    }
    
    onRGBChange() {
        if (!this.objectManager.selectedObject) return;
        
        const r = Math.max(0, Math.min(255, parseInt(this.inputs.r.value) || 0));
        const g = Math.max(0, Math.min(255, parseInt(this.inputs.g.value) || 0));
        const b = Math.max(0, Math.min(255, parseInt(this.inputs.b.value) || 0));
        
        this.isUpdating = true;
        this.colorPicker.color.rgb = { r, g, b };
        this.applyColor(this.colorPicker.color);
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    onHSVChange() {
        if (!this.objectManager.selectedObject) return;
        
        const h = Math.max(0, Math.min(360, parseInt(this.inputs.h.value) || 0));
        const s = Math.max(0, Math.min(100, parseInt(this.inputs.s.value) || 0));
        const v = Math.max(0, Math.min(100, parseInt(this.inputs.v.value) || 0));
        
        this.isUpdating = true;
        this.colorPicker.color.hsv = { h, s, v };
        this.applyColor(this.colorPicker.color);
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    onAlphaChange() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;
        
        const alpha = parseInt(this.inputs.alpha.value) / 100;
        this.inputs.alphaValue.textContent = this.inputs.alpha.value + '%';
        
        if (obj.material) {
            obj.material.transparent = alpha < 1;
            obj.material.opacity = alpha;
            obj.material.needsUpdate = true;
        }
    }
    
    onHexChange() {
        if (!this.objectManager.selectedObject) return;
        
        let hex = this.inputs.hex.value.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;
        
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            this.isUpdating = true;
            this.colorPicker.color.hexString = hex;
            this.applyColor(this.colorPicker.color);
            setTimeout(() => this.isUpdating = false, 50);
        }
    }
}