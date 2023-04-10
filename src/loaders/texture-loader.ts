import * as THREE from "three";

export class TextureLoader {
  loading = false;
  readonly textures = new Map<string, THREE.Texture>();

  private loadingManager = new THREE.LoadingManager();

  load(onLoad: () => void) {
    // Setup loading manager
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(
        `Loading texture: ${url}. \n Loaded ${itemsLoaded} of ${itemsTotal}`
      );
    };

    this.loadingManager.onLoad = () => {
      this.loading = false;
      onLoad();
    };

    this.loading = true;
    this.loadTextures();
  }

  private loadTextures() {
    const loader = new THREE.TextureLoader(this.loadingManager);

    // Door
    const doorAlphaUrl = new URL("/textures/door/alpha.jpg", import.meta.url)
      .href;
    loader.load(doorAlphaUrl, (texture) =>
      this.textures.set("door-alpha", texture)
    );

    const doorAoUrl = new URL(
      "/textures/door/ambientOcclusion.jpg",
      import.meta.url
    ).href;
    loader.load(doorAoUrl, (texture) => this.textures.set("door-ao", texture));

    const doorColorUrl = new URL("/textures/door/color.jpg", import.meta.url)
      .href;
    loader.load(doorColorUrl, (texture) =>
      this.textures.set("door-color", texture)
    );

    const doorHeightUrl = new URL("/textures/door/height.jpg", import.meta.url)
      .href;
    loader.load(doorHeightUrl, (texture) =>
      this.textures.set("door-height", texture)
    );

    const doorMetalUrl = new URL(
      "/textures/door/metalness.jpg",
      import.meta.url
    ).href;
    loader.load(doorMetalUrl, (texture) =>
      this.textures.set("door-metal", texture)
    );

    const doorNormalUrl = new URL("/textures/door/normal.jpg", import.meta.url)
      .href;
    loader.load(doorNormalUrl, (texture) =>
      this.textures.set("door-normal", texture)
    );

    const doorRoughUrl = new URL(
      "/textures/door/roughness.jpg",
      import.meta.url
    ).href;
    loader.load(doorRoughUrl, (texture) =>
      this.textures.set("door-rough", texture)
    );

    // Bricks
    const brickColorUrl = new URL("/textures/bricks/color.jpg", import.meta.url)
      .href;
    loader.load(brickColorUrl, (texture) => {
      this.textures.set("brick-color", texture);
    });

    const brickAoUrl = new URL(
      "/textures/bricks/ambientOcclusion.jpg",
      import.meta.url
    ).href;
    loader.load(brickAoUrl, (texture) =>
      this.textures.set("brick-ao", texture)
    );

    const brickNormalUrl = new URL(
      "/textures/bricks/normal.jpg",
      import.meta.url
    ).href;
    loader.load(brickNormalUrl, (texture) =>
      this.textures.set("brick-normal", texture)
    );

    const brickRoughUrl = new URL(
      "/textures/bricks/roughness.jpg",
      import.meta.url
    ).href;
    loader.load(brickRoughUrl, (texture) =>
      this.textures.set("brick-rough", texture)
    );

    // Grass
    const grassColorUrl = new URL("/textures/grass/color.jpg", import.meta.url)
      .href;
    loader.load(grassColorUrl, (texture) => {
      texture.repeat.set(8, 8);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.textures.set("grass-color", texture);
    });

    const grassAoUrl = new URL(
      "/textures/grass/ambientOcclusion.jpg",
      import.meta.url
    ).href;
    loader.load(grassAoUrl, (texture) => {
      texture.repeat.set(8, 8);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.textures.set("grass-ao", texture);
    });

    const grassNormalUrl = new URL(
      "/textures/grass/normal.jpg",
      import.meta.url
    ).href;
    loader.load(grassNormalUrl, (texture) => {
      texture.repeat.set(8, 8);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.textures.set("grass-normal", texture);
    });

    const grassRoughUrl = new URL(
      "/textures/grass/roughness.jpg",
      import.meta.url
    ).href;
    loader.load(grassRoughUrl, (texture) => {
      texture.repeat.set(8, 8);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.textures.set("grass-rough", texture);
    });
  }
}
