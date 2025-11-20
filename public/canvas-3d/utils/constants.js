export const DEFAULT_VALUES = {
    nearClip: 0.01,
    farClip: 100,
    snapSize: 0.5,
    gridSize: 40,
    frustumSize: 5
};

export const CAMERA_CONFIG = {
    fov: 70,
    near: 0.01,
    far: 100,
    position: { x: 3, y: 3, z: 3 }
};

export const GIZMO_CONFIG = {
    arrowLength: 1.5,
    arrowRadius: 0.03,
    coneHeight: 0.2,
    coneRadius: 0.08,
    ringRadius: 1.5,
    tubeRadius: 0.03,
    cubeSize: 0.15,
    diamondSize: 0.12
};

export const COLORS = {
    background: 0xffffff,
    gridMain: 0xbbbbbb,
    gridSecondary: 0xdddddd,
    axisX: 0xff0000,
    axisY: 0x00ff00,
    axisZ: 0x0000ff,
    highlight: 0xffa500,
    skewXY: 0xffff00,
    skewXZ: 0xff00ff,
    skewYZ: 0x00ffff,
    subtract: 0xff4444
};

export const MODES = {
    TRANSLATE: 'translate',
    SCALE: 'scale',
    ROTATE: 'rotate',
    SKEW: 'skew'
};