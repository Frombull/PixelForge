export class PositionPanel {
    constructor(transformHandler, objectManager, gizmoManager) {
        this.transformHandler = transformHandler;
        this.objectManager = objectManager;
        this.gizmoManager = gizmoManager;
        this.isUpdating = false;
        
        this.panel = document.getElementById('position-panel');
        this.inputs = {
            posX: document.getElementById('pos-x'),
            posY: document.getElementById('pos-y'),
            posZ: document.getElementById('pos-z'),
            scaleX: document.getElementById('scale-x'),
            scaleY: document.getElementById('scale-y'),
            scaleZ: document.getElementById('scale-z'),
            rotX: document.getElementById('rot-x'),
            rotY: document.getElementById('rot-y'),
            rotZ: document.getElementById('rot-z'),
            skewXY: document.getElementById('skew-xy'),
            skewXZ: document.getElementById('skew-xz'),
            skewYX: document.getElementById('skew-yx'),
            skewYZ: document.getElementById('skew-yz'),
            skewZX: document.getElementById('skew-zx'),
            skewZY: document.getElementById('skew-zy')
        };
        
        this.setupCollapsibles();
        this.setupListeners();
    }
    
    setupCollapsibles() {
        const sections = [
            { header: 'position-header', section: 'position-section' },
            { header: 'rotation-header', section: 'rotation-section' },
            { header: 'scale-header', section: 'scale-section' },
            { header: 'skew-header', section: 'skew-section' }
        ];
        
        sections.forEach(({ header, section }) => {
            const h = document.getElementById(header);
            const s = document.getElementById(section);
            
            h?.addEventListener('click', () => {
                const expanded = s.classList.contains('expanded');
                s.classList.toggle('expanded', !expanded);
                s.classList.toggle('collapsed', expanded);
                h.classList.toggle('open', !expanded);
            });
        });
    }
    
    setupListeners() {
        const { posX, posY, posZ, scaleX, scaleY, scaleZ, rotX, rotY, rotZ } = this.inputs;
        
        [posX, posY, posZ].forEach(i => {
            i.addEventListener('change', () => this.onPositionChange());
            i.addEventListener('keydown', e => e.key === 'Enter' && this.onPositionChange());
        });
        
        [scaleX, scaleY, scaleZ].forEach(i => {
            i.addEventListener('change', () => this.onScaleChange());
            i.addEventListener('keydown', e => e.key === 'Enter' && this.onScaleChange());
        });
        
        [rotX, rotY, rotZ].forEach(i => {
            i.addEventListener('change', () => this.onRotationChange());
            i.addEventListener('keydown', e => e.key === 'Enter' && this.onRotationChange());
        });
        
        const skewInputs = [
            this.inputs.skewXY, this.inputs.skewXZ, this.inputs.skewYX,
            this.inputs.skewYZ, this.inputs.skewZX, this.inputs.skewZY
        ];
        
        skewInputs.forEach(i => {
            i.addEventListener('change', () => this.onSkewChange());
            i.addEventListener('keydown', e => e.key === 'Enter' && this.onSkewChange());
        });
    }
    
    show() { this.panel.style.display = 'block'; }
    hide() { this.panel.style.display = 'none'; }
    
    update() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;
        
        const { posX, posY, posZ, scaleX, scaleY, scaleZ, rotX, rotY, rotZ } = this.inputs;
        
        posX.value = obj.position.x.toFixed(2);
        posY.value = obj.position.y.toFixed(2);
        posZ.value = obj.position.z.toFixed(2);
        
        scaleX.value = obj.scale.x.toFixed(2);
        scaleY.value = obj.scale.y.toFixed(2);
        scaleZ.value = obj.scale.z.toFixed(2);
        
        const rot = this.transformHandler.getRotationDegrees();
        rotX.value = rot.x.toFixed(2);
        rotY.value = rot.y.toFixed(2);
        rotZ.value = rot.z.toFixed(2);
        
        const skew = this.objectManager.getSkew(obj);
        this.inputs.skewXY.value = skew.xy.toFixed(2);
        this.inputs.skewXZ.value = skew.xz.toFixed(2);
        this.inputs.skewYX.value = skew.yx.toFixed(2);
        this.inputs.skewYZ.value = skew.yz.toFixed(2);
        this.inputs.skewZX.value = skew.zx.toFixed(2);
        this.inputs.skewZY.value = skew.zy.toFixed(2);
    }
    
    onPositionChange() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;
        
        this.isUpdating = true;
        const x = parseFloat(this.inputs.posX.value) || 0;
        const y = parseFloat(this.inputs.posY.value) || 0;
        const z = parseFloat(this.inputs.posZ.value) || 0;
        
        this.transformHandler.setPosition(obj, x, y, z);
        this.gizmoManager.updatePosition(obj.position);
        
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    onScaleChange() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;
        
        this.isUpdating = true;
        const x = Math.max(0.1, parseFloat(this.inputs.scaleX.value) || 1);
        const y = Math.max(0.1, parseFloat(this.inputs.scaleY.value) || 1);
        const z = Math.max(0.1, parseFloat(this.inputs.scaleZ.value) || 1);
        
        obj.scale.set(x, y, z);
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    onRotationChange() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;
        
        this.isUpdating = true;
        const rx = parseFloat(this.inputs.rotX.value) || 0;
        const ry = parseFloat(this.inputs.rotY.value) || 0;
        const rz = parseFloat(this.inputs.rotZ.value) || 0;
        
        this.transformHandler.setRotationFromDegrees(obj, rx, ry, rz);
        setTimeout(() => this.isUpdating = false, 50);
    }
    
    onSkewChange() {
        const obj = this.objectManager.selectedObject;
        if (!obj) return;
        
        this.isUpdating = true;
        const skew = {
            xy: parseFloat(this.inputs.skewXY.value) || 0,
            xz: parseFloat(this.inputs.skewXZ.value) || 0,
            yx: parseFloat(this.inputs.skewYX.value) || 0,
            yz: parseFloat(this.inputs.skewYZ.value) || 0,
            zx: parseFloat(this.inputs.skewZX.value) || 0,
            zy: parseFloat(this.inputs.skewZY.value) || 0
        };
        
        this.objectManager.setSkew(obj, skew);
        this.objectManager.applySkew(obj);
        setTimeout(() => this.isUpdating = false, 50);
    }
}