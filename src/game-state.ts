import * as THREE from "three";
import { BoxGeometry } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GameLoader } from "./loaders/game-loader";

export class GameState {
  private clock = new THREE.Clock();
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private ghostLights: THREE.PointLight[] = [];
  private rain?: THREE.Points;

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

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    // Lighting
    this.addLights();

    // Add scene objects
    this.addBoundaryWalls();
    this.addObjects();
    this.addGraves();
    this.addFog();
    this.addRain();

    // Start game
    this.clock.start();
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
    const { textures } = this.gameLoader.textureLoader;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        map: textures.get("grass-color"),
        aoMap: textures.get("grass-ao"),
        normalMap: textures.get("grass-normal"),
        roughnessMap: textures.get("grass-rough"),
      })
    );
    const floorUvs = floor.geometry.getAttribute("uv") as THREE.BufferAttribute;
    floor.geometry.setAttribute(
      "uv2",
      new THREE.Float32BufferAttribute(floorUvs.array, 2)
    );
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = 0;
    this.scene.add(floor);

    // House group
    const house = new THREE.Group();
    this.scene.add(house);

    // Walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 4),
      new THREE.MeshStandardMaterial({
        map: textures.get("brick-color"),
        aoMap: textures.get("brick-ao"),
        normalMap: textures.get("brick-normal"),
        roughnessMap: textures.get("brick-rough"),
      })
    );
    const wallUvs = walls.geometry.getAttribute("uv") as THREE.BufferAttribute;
    walls.geometry.setAttribute(
      "uv2",
      new THREE.Float32BufferAttribute(wallUvs.array, 2)
    );
    walls.castShadow = true;
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
      new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
      new THREE.MeshStandardMaterial({
        map: textures.get("door-color"),
        transparent: true,
        alphaMap: textures.get("door-alpha"),
        aoMap: textures.get("door-ao"),
        displacementMap: textures.get("door-height"),
        displacementScale: 0.1,
        normalMap: textures.get("door-normal"),
        metalnessMap: textures.get("door-metal"),
        roughnessMap: textures.get("door-rough"),
      })
    );
    const uvs = door.geometry.getAttribute("uv") as THREE.BufferAttribute;
    door.geometry.setAttribute(
      "uv2",
      new THREE.Float32BufferAttribute(uvs.array, 2)
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

    [bush1, bush2, bush3, bush4].forEach((bush) => (bush.castShadow = true));
  }

  private addBoundaryWalls() {
    const { textures } = this.gameLoader.textureLoader;
    const { modelLoader } = this.gameLoader;

    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.get("brick-color"),
      aoMap: textures.get("brick-ao"),
      normalMap: textures.get("brick-normal"),
      roughnessMap: textures.get("brick-rough"),
    });

    const wallHeight = 0.6;
    const wallThickness = 0.3;

    const fence = modelLoader.get("iron-fence");
    if (!fence) {
      return;
    }
    fence.scale.x *= 2;

    // Do walls in chunks for better texture res
    for (let left = 0; left < 10; left++) {
      const wallChunk = new THREE.Mesh(
        new BoxGeometry(wallThickness, wallHeight, 2),
        wallMat
      );
      wallChunk.position.y = wallHeight / 2;
      wallChunk.position.x = -10;
      wallChunk.position.z = -9 + left * 2;

      const fenceSegment = fence.clone();
      fenceSegment.position.copy(wallChunk.position);
      fenceSegment.position.x = wallChunk.position.x - wallThickness * 1.5;
      fenceSegment.position.y += 0.25;
      fenceSegment.rotateY(Math.PI * 0.5);

      this.scene.add(wallChunk, fenceSegment);
    }

    for (let right = 0; right < 10; right++) {
      const wallChunk = new THREE.Mesh(
        new BoxGeometry(0.3, wallHeight, 2),
        wallMat
      );
      wallChunk.position.y = wallHeight / 2;
      wallChunk.position.x = 10;
      wallChunk.position.z = -9 + right * 2;

      const fenceSegment = fence.clone();
      fenceSegment.position.copy(wallChunk.position);
      fenceSegment.position.x = wallChunk.position.x - wallThickness * 1.5;
      fenceSegment.position.y += 0.25;
      fenceSegment.rotateY(Math.PI * 0.5);

      this.scene.add(wallChunk, fenceSegment);
    }

    for (let back = 0; back < 10; back++) {
      const wallChunk = new THREE.Mesh(
        new BoxGeometry(0.3, wallHeight, 2.3),
        wallMat
      );
      wallChunk.position.y = wallHeight / 2;
      wallChunk.position.x = -9 + back * 2;
      wallChunk.position.z = -10;
      wallChunk.rotateY(Math.PI * 0.5);

      const fenceSegment = fence.clone();
      fenceSegment.position.copy(wallChunk.position);
      fenceSegment.position.z = wallChunk.position.z - wallThickness * 1.5;
      fenceSegment.position.y += 0.25;

      this.scene.add(wallChunk, fenceSegment);
    }

    for (let front = 0; front < 10; front++) {
      const wallChunk = new THREE.Mesh(
        new BoxGeometry(0.3, wallHeight, 2.3),
        wallMat
      );
      wallChunk.position.y = wallHeight / 2;
      wallChunk.position.x = -9 + front * 2;
      wallChunk.position.z = 10;
      wallChunk.rotateY(Math.PI * 0.5);

      const fenceSegment = fence.clone();
      fenceSegment.position.copy(wallChunk.position);
      fenceSegment.position.z = wallChunk.position.z - wallThickness * 1.5;
      fenceSegment.position.y += 0.25;

      this.scene.add(wallChunk, fenceSegment);
    }
  }

  private addGraves() {
    const { modelLoader } = this.gameLoader;

    const graveModels: THREE.Object3D[] = [];
    const graveBevel = modelLoader.get("grave-bevel");
    if (graveBevel) {
      graveModels.push(graveBevel);
    }
    const graveDeco = modelLoader.get("grave-deco");
    if (graveDeco) {
      graveModels.push(graveDeco);
    }
    const graveCross = modelLoader.get("grave-cross");
    if (graveCross) {
      graveModels.push(graveCross);
    }
    const graveRound = modelLoader.get("grave-round");
    if (graveRound) {
      graveModels.push(graveRound);
    }

    const graves = new THREE.Group();
    this.scene.add(graves);

    const graveCount = 50;
    for (let i = 0; i < graveCount; i++) {
      // Work out random grave transform
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.2 + Math.random() * 6;

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      // Use random grave model
      const rnd = Math.floor(Math.random() * graveModels.length);
      const grave = graveModels[rnd].clone();

      grave.position.set(x, -0.03, z);
      grave.rotation.y = (Math.random() - 0.5) * 0.4;
      grave.rotation.z = (Math.random() - 0.5) * 0.2;

      graves.add(grave);
    }
  }

  private addLights() {
    const ambientLight = new THREE.AmbientLight("#b9d5ff", 0.02);
    this.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight("#b9d5ff", 0.02);
    moonLight.castShadow = true;
    moonLight.position.set(4, 5, -2);
    this.scene.add(moonLight);

    // Door light
    const doorLight = new THREE.PointLight("#ff7d46", 1, 7);
    doorLight.castShadow = true;
    doorLight.shadow.mapSize.set(256, 256);
    doorLight.position.set(0, 2.2, 2.7);
    this.scene.add(doorLight);

    // Ghost light
    const ghost1 = new THREE.PointLight("#ff00ff", 2, 3);
    ghost1.castShadow = true;
    this.scene.add(ghost1);

    const ghost2 = new THREE.PointLight("#00ffff", 2, 3);
    ghost2.castShadow = true;
    this.scene.add(ghost2);

    const ghost3 = new THREE.PointLight("#ffff00", 2, 3);
    ghost3.castShadow = true;
    this.scene.add(ghost3);

    this.ghostLights = [ghost1, ghost2, ghost3];
  }

  private addFog() {
    const fog = new THREE.Fog("#262837", 1, 15);
    this.scene.fog = fog;
  }

  private addRain() {
    const { textures } = this.gameLoader.textureLoader;

    const rainMat = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      alphaMap: textures.get("rain"),
      color: "#9099a1",
    });

    const rainGeom = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }

    rainGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const rain = new THREE.Points(rainGeom, rainMat);

    this.scene.add(rain);

    this.rain = rain;
  }

  private update = () => {
    requestAnimationFrame(this.update);

    const elapsedTime = this.clock.getElapsedTime();

    // Update ghosts
    const ghost1Angle = elapsedTime * 0.5;
    const ghost1 = this.ghostLights[0];
    ghost1.position.x = Math.cos(ghost1Angle) * 4;
    ghost1.position.z = Math.sin(ghost1Angle) * 4;
    ghost1.position.y = Math.sin(elapsedTime * 3);

    const ghost2Angle = -elapsedTime * 0.32;
    const ghost2 = this.ghostLights[1];
    ghost2.position.x = Math.cos(ghost2Angle) * 5;
    ghost2.position.z = Math.sin(ghost2Angle) * 5;
    ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

    const ghost3Angle = -elapsedTime * 0.5;
    const ghost3 = this.ghostLights[2];
    ghost3.position.x =
      Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32));
    ghost3.position.z =
      Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.5));
    ghost3.position.y = Math.sin(elapsedTime * 5) + Math.sin(elapsedTime * 2);

    // Update rain
    if (this.rain) {
      this.rain.position.y -= 0.15;
      if (this.rain.position.y < -6) {
        this.rain.position.y = 0;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  };
}
