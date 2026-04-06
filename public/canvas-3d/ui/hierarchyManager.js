import * as THREE from 'three';

export class HierarchyManager {
    constructor(objectManager, app) {
        this.objectManager = objectManager;
        this.app = app;
        this.list = document.getElementById('hierarchy-list');

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Hook into delete to refresh hierarchy
        const origDelete = objectManager.deleteSelected.bind(objectManager);
        objectManager.deleteSelected = () => {
            const result = origDelete();
            if (result) this.refresh();
            return result;
        };
    }

    refresh() {
        const objects = this.objectManager.objects;
        if (!this.list) return;

        if (objects.length === 0) {
            this.list.innerHTML = '<div class="hierarchy-empty">Nenhum objeto adicionado</div>';
            return;
        }

        // Save existing elements to avoid recreating if names match
        const fragment = document.createDocumentFragment();

        objects.forEach(obj => {
            const name = obj.userData.name || 'Object';
            const isSelected = obj === this.objectManager.selectedObject;

            const item = document.createElement('div');
            item.className = 'hierarchy-item' + (isSelected ? ' selected' : '');
            item.dataset.uuid = obj.uuid;

            item.innerHTML = `
                <svg class="hierarchy-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span class="hierarchy-name">${name}</span>
                <button class="hierarchy-delete" title="Delete">×</button>
            `;

            // Click to select
            item.addEventListener('click', (e) => {
                if (e.target.closest('.hierarchy-delete')) return;
                this.app.objectManager.select(obj);
                this.app.transformHandler.resetWorldRotations();
                this.app.updateSelection();
                this.highlightSelected();
            });

            // Double click to focus
            item.addEventListener('dblclick', () => {
                this.app.controlsManager.focusOnObject(obj, this.app.sceneManager.camera);
            });

            // Delete button
            const deleteBtn = item.querySelector('.hierarchy-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.objectManager.select(obj);
                this.app.objectManager.deleteSelected();
                this.app.updateSelection();
                this.refresh();
            });

            fragment.appendChild(item);
        });

        this.list.innerHTML = '';
        this.list.appendChild(fragment);
    }

    highlightSelected() {
        const selected = this.objectManager.selectedObject;
        this.list.querySelectorAll('.hierarchy-item').forEach(item => {
            const isSelected = item.dataset.uuid === selected?.uuid;
            item.classList.toggle('selected', isSelected);
        });
    }

    selectSelected() {
        this.highlightSelected();
    }
}
