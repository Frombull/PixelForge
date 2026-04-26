export const CONSTANTS = {
    DEFAULT_VALUES: {
        snapSize: 0.5,
        gridSize: 40,
        frustumSize: 5
    },
    CAMERA_CONFIG: {
        fov: 60,
        near: 0.01,
        far: 50,
        position: { x: 3, y: 3, z: 3 }
    },
    CAMERA_PROJECTION_DEFAULTS: {
        perspective: {
            fov: 60,
            near: 0.01,
            far: 50,
            aspectRatio: 1.78,
            focalLength: 35
        },
        orthographic: {
            near: 0.01,
            far: 50,
            zoom: 1,
            zoomMin: 0.1,
            zoomMax: 5,
            aspectRatio: 1.78,
            size: 5
        },
        panini: {
            fov: 60,
            near: 0.01,
            far: 50,
            distance: 1,
            squeeze: 0.5,
            strength: 0.45
        }
    },
    GIZMO_CONFIG: {
        arrowLength: 1.5,
        arrowRadius: 0.03,
        coneHeight: 0.2,
        coneRadius: 0.08,
        ringRadius: 1.5,
        tubeRadius: 0.03,
        cubeSize: 0.15,
        diamondSize: 0.12
    },
    COLORS: {
        background: 0xffffff,
        gridMain: 0xbbbbbb,
        gridSecondary: 0xdddddd,
        axisX: 0xff0000,
        axisY: 0x00ff00,
        axisZ: 0x0000ff,
        highlight: 0xdfdfdf,
        skewXY: 0xffff00,
        skewXZ: 0xff00ff,
        skewYZ: 0x00ffff,
        subtract: 0xff4444
    },
    MODES: {
        TRANSLATE: 'translate',
        SCALE: 'scale',
        ROTATE: 'rotate',
        SKEW: 'skew'
    },
    KEY_BINDINGS: {
        TRANSLATE_MODE: 'w',
        ROTATE_MODE: 'r',
        SCALE_MODE: 's',
        SKEW_MODE: 'k',
        TOGGLE_CAMERA: 'o',
        FOCUS_SELECTED: 'f',
        DELETE_SELECTED: 'delete',
        VIEW_FRONT: 'Numpad7',
        VIEW_RIGHT: 'Numpad3',
        VIEW_TOP: 'Numpad1'
    },
    APP_CONFIG: {
        stateEventName: 'canvas3d:state',
        transformControlSize: 0.9,
        viewportGizmo: {
            placement: 'bottom-right',
            size: 96,
            offset: {
                right: 12,
                bottom: 12
            }
        },
        skewDragFactor: 0.5,
        minScale: 0.1,
        defaultGridColorHex: '#bbbbbb',
        defaultMaterialColorHex: '#ffffff'
    }
};

export const {
    DEFAULT_VALUES,
    CAMERA_CONFIG,
    CAMERA_PROJECTION_DEFAULTS,
    GIZMO_CONFIG,
    COLORS,
    MODES,
    KEY_BINDINGS,
    APP_CONFIG
} = CONSTANTS;