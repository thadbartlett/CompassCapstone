// viewer.js
//
// Three.js 360 panorama viewer with drag-to-look controls.
//
// - Maps the equirectangular image onto the INSIDE of a sphere (material on
//   BackSide, camera at the sphere's center).
// - Drag (mouse + touch) rotates the view: yaw wraps fully around, pitch is
//   clamped so you can't flip over.
// - Optional slow scroll-to-zoom (field of view).
// - Exposes helpers to convert between yaw/pitch (degrees) and screen pixels,
//   which hotspots.js uses to position markers, and authoring mode uses to
//   read off click coordinates.
//
// COORDINATE CONVENTION (shared with hotspots.config.js):
//   yaw   = degrees around the room; 0 faces -Z, positive turns right; -180..180
//   pitch = degrees up/down; 0 = horizon, + up, - down.
//
// The mapping to a 3D direction vector:
//   phi   = (90 - pitch) in radians   (polar angle from +Y)
//   theta = yaw in radians
//   dir = ( sin(phi)*sin(theta),  cos(phi),  -sin(phi)*cos(theta) )
// which gives dir=(0,0,-1) at yaw=0,pitch=0.

import * as THREE from "three";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const PITCH_LIMIT = 85; // degrees up/down

// Field of view is FIXED — there is intentionally no zoom. The panorama is a
// modest-resolution equirectangular image; zooming in (narrower FOV) magnifies
// its softness, so we lock the FOV at a flattering ~76° (natural view, minimal
// per-pixel magnification) and drop scroll-to-zoom entirely.
const DEFAULT_FOV = 76;

export class Viewer {
  constructor(mountEl, imageUrl) {
    this.mountEl = mountEl;
    this.imageUrl = imageUrl;

    // Camera orientation, in degrees.
    this.yaw = 0;
    this.pitch = 0;
    this.fov = DEFAULT_FOV;

    // Drag state.
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._pointerId = null;
    this._movedDistance = 0;

    // Callbacks.
    this._onClickHandlers = []; // (yaw, pitch, dir, event) => void
    this._onRenderHandlers = []; // () => void  (each frame, after camera update)

    this._initThree();
    this._loadPanorama();
    this._bindEvents();
    this._animate();
  }

  _initThree() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, w / h, 0.1, 1100);
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.mountEl.appendChild(this.renderer.domElement);

    // Sphere with the material on the inside.
    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1); // flip so the texture faces inward
    this._geometry = geometry;

    // Placeholder material until the texture loads.
    this._material = new THREE.MeshBasicMaterial({ color: 0x101418 });
    this.sphere = new THREE.Mesh(geometry, this._material);
    this.scene.add(this.sphere);

    this._raycaster = new THREE.Raycaster();
  }

  _loadPanorama() {
    const loader = new THREE.TextureLoader();
    loader.load(
      this.imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        // Anisotropic filtering: the cheapest perceived-sharpness win for a
        // low-res panorama. It cleans up the walls where they're viewed at a
        // grazing angle (most of the time), rather than smearing them.
        const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
        texture.anisotropy = maxAniso;
        this._material.dispose();
        this._material = new THREE.MeshBasicMaterial({ map: texture });
        this.sphere.material = this._material;
        if (this._onReady) this._onReady();
      },
      undefined,
      (err) => {
        console.error("[viewer] failed to load panorama:", this.imageUrl, err);
      }
    );
  }

  onReady(cb) {
    this._onReady = cb;
  }

  // ---- Coordinate conversions -------------------------------------------

  // yaw/pitch (deg) -> normalized direction vector (THREE.Vector3)
  static anglesToDir(yawDeg, pitchDeg) {
    const phi = (90 - pitchDeg) * DEG;
    const theta = yawDeg * DEG;
    return new THREE.Vector3(
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
      -Math.sin(phi) * Math.cos(theta)
    );
  }

  // direction vector -> yaw/pitch (deg)
  static dirToAngles(dir) {
    const v = dir.clone().normalize();
    const pitch = Math.asin(THREE.MathUtils.clamp(v.y, -1, 1)) * RAD;
    const yaw = Math.atan2(v.x, -v.z) * RAD;
    return { yaw, pitch };
  }

  // Where is the camera currently looking (as a direction vector)?
  getLookDir() {
    return Viewer.anglesToDir(this.yaw, this.pitch);
  }

  // Project a world/direction vector to screen pixels.
  // Returns { x, y, visible } where visible=false if it's behind the camera.
  dirToScreen(dir) {
    const p = dir.clone().multiplyScalar(100); // any point along the ray
    const projected = p.project(this.camera); // NDC space, z<1 in front
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    return {
      x: projected.x * halfW + halfW,
      y: -projected.y * halfH + halfH,
      visible: projected.z < 1,
    };
  }

  // ---- Camera update -----------------------------------------------------

  _updateCamera() {
    this.pitch = THREE.MathUtils.clamp(this.pitch, -PITCH_LIMIT, PITCH_LIMIT);
    // Normalize yaw to -180..180 for tidy authoring readouts.
    if (this.yaw > 180) this.yaw -= 360;
    if (this.yaw < -180) this.yaw += 360;

    const dir = this.getLookDir();
    this.camera.lookAt(dir.x, dir.y, dir.z);

    if (this.camera.fov !== this.fov) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  // ---- Events ------------------------------------------------------------

  _bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    window.addEventListener("pointermove", (e) => this._onPointerMove(e));
    window.addEventListener("pointerup", (e) => this._onPointerUp(e));
    window.addEventListener("resize", () => this._onResize());

    // Prevent the browser's native image/text drag & context menu.
    el.addEventListener("dragstart", (e) => e.preventDefault());
  }

  _onPointerDown(e) {
    this._dragging = true;
    this._pointerId = e.pointerId;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this._movedDistance = 0;
    this.mountEl.classList.add("grabbing");
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this._movedDistance += Math.abs(dx) + Math.abs(dy);

    // Fixed drag sensitivity (FOV never changes, so no scaling needed).
    const sens = 0.12;
    this.yaw += dx * sens; // drag right -> look right
    this.pitch += dy * sens; // drag down -> look down
  }

  _onPointerUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this.mountEl.classList.remove("grabbing");

    // Treat as a click only if the pointer barely moved (not a drag).
    if (this._movedDistance < 6) {
      this._emitClick(e);
    }
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // Raycast a screen click into the sphere and report yaw/pitch.
  _emitClick(e) {
    const ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    this._raycaster.setFromCamera(ndc, this.camera);
    const hits = this._raycaster.intersectObject(this.sphere, false);
    if (!hits.length) return;

    // Direction from center to the hit point.
    const dir = hits[0].point.clone().normalize();
    const { yaw, pitch } = Viewer.dirToAngles(dir);
    for (const cb of this._onClickHandlers) cb(yaw, pitch, dir, e);
  }

  onClick(cb) {
    this._onClickHandlers.push(cb);
  }

  onRender(cb) {
    this._onRenderHandlers.push(cb);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this._updateCamera();
    this.renderer.render(this.scene, this.camera);
    for (const cb of this._onRenderHandlers) cb();
  }
}
