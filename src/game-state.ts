import * as THREE from "three";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GameLoader } from "./loaders/game-loader";
import { addGui } from "./utils/utils";

export class GameState {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private gui = new GUI();

  constructor(
    private canvas: HTMLCanvasElement,
    private gameLoader: GameLoader
  ) {
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(4, 2, 5);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    THREE.ColorManagement.legacyMode = false;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    window.addEventListener("resize", this.onCanvasResize);
    this.onCanvasResize();

    this.scene.background = new THREE.Color("#1680AF");

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    // Lighting
    this.addLights();

    // Add scene objects
    this.addObjects();

    // Start game
    this.update();
  }

  private onCanvasResize = () => {
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      false
    );

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;

    this.camera.updateProjectionMatrix();
  };

  private addObjects() {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ roughness: 0.7 })
    );
    sphere.position.y = 1;
    this.scene.add(sphere);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: "#a9c388" })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = 0;
    this.scene.add(floor);
  }

  private addLights() {
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.5);
    this.gui
      .add(ambientLight, "intensity")
      .min(0)
      .max(1)
      .step(0.001)
      .name("ambient intensity");
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight("#ffffff", 0.5);
    moonLight.position.set(4, 5, -2);
    this.gui
      .add(moonLight, "intensity")
      .min(0)
      .max(1)
      .step(0.001)
      .name("directional intensity");
    this.gui.add(moonLight.position, "x").min(-5).max(5).step(0.001);
    this.gui.add(moonLight.position, "y").min(-5).max(5).step(0.001);
    this.gui.add(moonLight.position, "z").min(-5).max(5).step(0.001);
    this.scene.add(moonLight);
  }

  private update = () => {
    requestAnimationFrame(this.update);

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  };
}
