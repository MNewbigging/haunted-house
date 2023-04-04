import * as THREE from "three";
import GUI from "lil-gui";
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
    this.renderer.setClearColor("#262837");
    window.addEventListener("resize", this.onCanvasResize);
    this.onCanvasResize();

    //this.scene.background = new THREE.Color("#1680AF");

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    // Lighting
    this.addLights();

    // Add scene objects
    this.addObjects();
    this.addGraves();
    this.addFog();

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
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: "#a9c388" })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = 0;
    this.scene.add(floor);

    const house = new THREE.Group();
    this.scene.add(house);

    // Walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: "#ac8e82" })
    );
    walls.position.y = 1.25;
    house.add(walls);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 1, 4),
      new THREE.MeshStandardMaterial({ color: "#b35f45" })
    );
    roof.position.y = 3; // wall height plus half roof height
    roof.rotateY(Math.PI / 4);
    house.add(roof);

    // Door
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshStandardMaterial({ color: "#aa7b7b" })
    );
    door.position.y = 1;
    door.position.z = 2.01;
    house.add(door);

    // Bushes
    const bushGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bushMaterial = new THREE.MeshStandardMaterial({ color: "#89c854" });

    const bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush1.scale.set(0.5, 0.5, 0.5);
    bush1.position.set(0.8, 0.2, 2.2);

    const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush2.scale.set(0.25, 0.25, 0.25);
    bush2.position.set(1.4, 0.1, 2.1);

    const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush3.scale.set(0.4, 0.4, 0.4);
    bush3.position.set(-0.8, 0.1, 2.2);

    const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
    bush4.scale.set(0.15, 0.15, 0.15);
    bush4.position.set(-1, 0.05, 2.6);

    house.add(bush1, bush2, bush3, bush4);
  }

  private addGraves() {
    const graves = new THREE.Group();
    this.scene.add(graves);

    const graveGeom = new THREE.BoxGeometry(0.6, 0.8, 0.2);
    const graveMat = new THREE.MeshStandardMaterial({ color: "#b2b6b1" });

    const graveCount = 50;
    for (let i = 0; i < graveCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.2 + Math.random() * 6;

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const grave = new THREE.Mesh(graveGeom, graveMat);
      grave.position.set(x, 0.3, z);
      grave.rotation.y = (Math.random() - 0.5) * 0.4;
      grave.rotation.z = (Math.random() - 0.5) * 0.2;

      graves.add(grave);
    }
  }

  private addLights() {
    const ambientLight = new THREE.AmbientLight("#b9d5ff", 0.12);
    this.gui
      .add(ambientLight, "intensity")
      .min(0)
      .max(1)
      .step(0.001)
      .name("ambient intensity");
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight("#b9d5ff", 0.12);
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

    // Door light
    const doorLight = new THREE.PointLight("#ff7d46", 1, 7);
    doorLight.position.set(0, 2.2, 2.7);
    this.scene.add(doorLight);
  }

  private addFog() {
    const fog = new THREE.Fog("#262837", 1, 15);
    this.scene.fog = fog;
  }

  private update = () => {
    requestAnimationFrame(this.update);

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  };
}
