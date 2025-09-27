class SidePanel {
  // User settings
  static shouldDrawVertices: boolean = true;
  static shouldDrawGrid: boolean = true;
  static shouldDrawAxis: boolean = true;
  static shouldDrawDebugWindow: boolean = true;
  static controlPanelSize = { x: 350, y: 10 };

  // Tool management
  static Buttons: Button[] = [];

  static registerButton(button: Button) {
    SidePanel.Buttons.push(button);
  }

  static updateActiveButton() {
    SidePanel.Buttons.forEach((tb) => {
      tb.setActive(selectedTool === tb.tool);
    });
  }

  static createControlPanel() {
    let controlPanel = createDiv("").class("control-panel");
    controlPanel.position(
      windowWidth - SidePanel.controlPanelSize.x,
      SidePanel.controlPanelSize.y
    );

    let createSection = createDiv("").class("section").parent(controlPanel);
    createDiv("").class("section-title").html("Tools").parent(createSection);

    // Create Polygon Button
    new Button(
      "Create Polygon",
      createSection,
      () => {
        CreatePolygon.tempPolygon = [];
        selectedVertex = null;
        selectedCentroid = null;
      },
      {
        tool: Tool.CREATE_POLYGON,
        iconPath: "static-project/icons/create.svg",
      }
    );

    // Translate Tool Button
    new Button(
      "Translate",
      createSection,
      () => {
        CreatePolygon.cancelPolygonCreation();
      },
      {
        tool: Tool.TRANSLATE,
        iconPath: "static-project/icons/translate.svg",
      }
    );

    // Rotate Tool Button
    new Button(
      "Rotate",
      createSection,
      () => {
        CreatePolygon.cancelPolygonCreation();
      },
      {
        tool: Tool.ROTATE,
        iconPath: "static-project/icons/rotate.svg",
      }
    );

    // Scale Tool Button
    new Button(
      "Scale",
      createSection,
      () => {
        CreatePolygon.cancelPolygonCreation();
      },
      {
        tool: Tool.SCALE,
        iconPath: "static-project/icons/scale.svg",
      }
    );

    // Curves Button
    new Button(
      "Curves",
      createSection,
      () => {
        CurvesUI.toggleCurvesPanel(true);
      },
      {
        iconPath: "static-project/icons/curve.svg",
      }
    );

    // Animation Button
    new Button(
      "Animation",
      createSection,
      () => {
        selectedTool = Tool.ANIMATION;
        AnimationUI.toggleAnimationPanel(true);
      },
      {
        tool: Tool.ANIMATION,
        iconPath: "static-project/icons/animation-icon.svg",
      }
    );

    createDiv("")
      .class("section-title")
      .html("Transformations")
      .parent(createSection);

    // Container for Mirror buttons
    let mirrorContainer = createDiv("")
      .style("display", "flex")
      .style("gap", "5px")
      .parent(createSection);

    // Button Mirror X
    new Button(
      "Mirror X",
      mirrorContainer,
      () => {
        Mirror.mirror("y");
      },
      {
        iconPath: "static-project/icons/mirror-x.svg",
      }
    );

    // Button Mirror Y
    new Button(
      "Mirror Y",
      mirrorContainer,
      () => {
        Mirror.mirror("x");
      },
      {
        iconPath: "static-project/icons/mirror-y.svg",
      }
    );

    // Button Shear Uniform
    new Button(
      "Uniform Shear",
      createSection,
      () => {
        Shear.ShearUniform();
      },
      {
        iconPath: "static-project/icons/skew.svg",
      }
    );

    // Button Shear Non-Uniform
    new Button(
      "Non-Uniform Shear",
      createSection,
      () => {
        Shear.ShearNonUniform();
      },
      {
        iconPath: "static-project/icons/skew.svg",
      }
    );

    // Button Reset Polygon
    new Button("Reset Polygon", createSection, () => {
      if (selectedPolygon) {
        selectedPolygon.resetPolygon();
      }
    });

    // ------------------------------ COLOR PICKER ------------------------------
    createDiv("").class("section-title").html("Color").parent(createSection);

    // Button color picker
    ColorPickerUI.colorPickerButton = new Button(
      "Color Picker",
      createSection,
      () => {
        ColorPickerUI.toggle();
      },
      {
        iconPath: "static-project/icons/color-palette.svg", // TODO: Edit color-palette-v2.svg to remove outline
      }
    );

    // ------------------------------  ------------------------------
    createDiv("").class("section-title").html("Display").parent(createSection);

    // Draw vertices button
    new Button(
      "",
      createSection,
      () => {
        SidePanel.shouldDrawVertices = !SidePanel.shouldDrawVertices;
      },
      {
        iconPath: "static-project/icons/draw-vertices-on.svg",
        fixedWidth: false,
      }
    );

    // Draw grid button
    new Button(
      "",
      createSection,
      () => {
        SidePanel.shouldDrawGrid = !SidePanel.shouldDrawGrid;
      },
      {
        iconPath: "static-project/icons/grid.svg",
        fixedWidth: false,
      }
    );

    // Draw axis button
    new Button(
      "",
      createSection,
      () => {
        SidePanel.shouldDrawAxis = !SidePanel.shouldDrawAxis;
      },
      {
        iconPath: "./static-project/icons/axis.svg",
        fixedWidth: false,
      }
    );

    // Draw debug window button
    new Button(
      "",
      createSection,
      () => {
        SidePanel.shouldDrawDebugWindow = !SidePanel.shouldDrawDebugWindow;
      },
      {
        iconPath: "/static-project/icons/debug-v2.svg", // TODO: Edit debug.svg to remove outline
        fixedWidth: false,
      }
    );

    SidePanel.initColorPickerUI();
    CurvesUI.setupCurvesUI();
    AnimationUI.createAnimationPanel();

    // Set the initial active tool
    SidePanel.updateActiveButton();
  }

  static initColorPickerUI() {
    new ColorPickerUI();

    // Color change callback
    ColorPickerUI.onColorChange((colorObj) => {
      if (selectedPolygon) {
        // Create p5 color using window.color instead of directly referencing color
        // This avoids conflicts with parameter naming
        const r = colorObj.rgb.r;
        const g = colorObj.rgb.g;
        const b = colorObj.rgb.b;
        const a = colorObj.alpha * 255;

        const newColor = window["color"](r, g, b, a);
        selectedPolygon.fillColor = newColor;
      }
    });

    // Initialize with default color
    ColorPickerUI.setColor(Colors.PolygonBlue);
  }

  static handleWindowResize() {
    let controlPanel = select(
      ".control-panel:not(.curves-panel):not(.animation-panel)"
    );

    if (controlPanel) {
      controlPanel.position(
        windowWidth - SidePanel.controlPanelSize.x,
        SidePanel.controlPanelSize.y
      );
    }

    CurvesUI.handleWindowResize();
    AnimationUI.handleWindowResize();
  }
}
