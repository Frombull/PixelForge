import { DEFAULT_VALUES } from '/canvas-3d/utils/constants.js';

export class SettingsMenu {
    constructor(sceneManager, transformHandler) {
        this.sceneManager = sceneManager;
        this.transformHandler = transformHandler;
        
        this.menu = document.getElementById('settings-menu');
        this.btn = document.getElementById('btn-settings');
        
        this.elements = {
            toggleGrid: document.getElementById('toggle-grid'),
            toggleSnap: document.getElementById('toggle-snap'),
            snapSize: document.getElementById('snap-size'),
            snapSizeItem: document.querySelector('.snap-size-item'),
            bgColor: document.getElementById('bg-color'),
            gridColor: document.getElementById('grid-color'),
            nearClip: document.getElementById('near-clip'),
            nearClipValue: document.getElementById('near-clip-value'),
            farClip: document.getElementById('far-clip'),
            farClipValue: document.getElementById('far-clip-value')
        };
        
        this.init();
    }
    
    init() {
        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.menu.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target) && e.target !== this.btn) {
                this.menu.classList.add('hidden');
            }
        });
        
        this.menu.addEventListener('click', e => e.stopPropagation());
        
        this.setupListeners();
    }
    
    setupListeners() {
        const { toggleGrid, toggleSnap, snapSize, snapSizeItem, 
                bgColor, gridColor, nearClip, nearClipValue, farClip, farClipValue } = this.elements;
        
        toggleGrid.addEventListener('change', (e) => {
            this.sceneManager.setGridVisible(e.target.checked);
        });
        
        toggleSnap.addEventListener('change', (e) => {
            this.transformHandler.snapToGrid = e.target.checked;
            snapSizeItem.classList.toggle('enabled', e.target.checked);
        });
        
        snapSize.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (val > 0) {
                this.transformHandler.gridSize = val;
            } else {
                snapSize.value = this.transformHandler.gridSize;
            }
        });
        
        bgColor.addEventListener('input', (e) => {
            this.sceneManager.setBackgroundColor(e.target.value);
        });
        
        gridColor.addEventListener('input', (e) => {
            this.sceneManager.setGridColor(e.target.value);
        });
        
        nearClip.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (val > 0) {
                this.sceneManager.setClipPlanes(val, undefined);
                nearClipValue.textContent = val.toFixed(2);
            }
        });
        
        farClip.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.sceneManager.setClipPlanes(undefined, val);
            farClipValue.textContent = val;
        });
    }
    
    resetValue(target) {
        const { nearClip, nearClipValue, farClip, farClipValue, snapSize } = this.elements;
        
        if (target === 'near-clip') {
            this.sceneManager.setClipPlanes(DEFAULT_VALUES.nearClip, undefined);
            nearClip.value = DEFAULT_VALUES.nearClip;
            nearClipValue.textContent = DEFAULT_VALUES.nearClip.toFixed(2);
        } else if (target === 'far-clip') {
            this.sceneManager.setClipPlanes(undefined, DEFAULT_VALUES.farClip);
            farClip.value = DEFAULT_VALUES.farClip;
            farClipValue.textContent = DEFAULT_VALUES.farClip;
        } else if (target === 'snap-size') {
            this.transformHandler.gridSize = DEFAULT_VALUES.snapSize;
            snapSize.value = DEFAULT_VALUES.snapSize;
        }
    }
}