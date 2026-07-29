export type SoftMeshPoint = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
};

export type SoftMeshLandmarks = {
  head: SoftMeshPoint;
  body: SoftMeshPoint;
  leftEar: SoftMeshPoint;
  rightEar: SoftMeshPoint;
  leftArm: SoftMeshPoint;
  rightArm: SoftMeshPoint;
  leftFoot: SoftMeshPoint;
  rightFoot: SoftMeshPoint;
};

export type SoftMeshPose = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  bodyBreath: number;
  bodyStretch: number;
  bodyLean: number;
  headAngle: number;
  headX: number;
  headY: number;
  leftEarX: number;
  leftEarY: number;
  rightEarX: number;
  rightEarY: number;
  leftArmX: number;
  leftArmY: number;
  rightArmX: number;
  rightArmY: number;
  leftFootX: number;
  leftFootY: number;
  rightFootX: number;
  rightFootY: number;
};

export const STILL_SOFT_MESH_POSE: SoftMeshPose = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  bodyBreath: 0,
  bodyStretch: 0,
  bodyLean: 0,
  headAngle: 0,
  headX: 0,
  headY: 0,
  leftEarX: 0,
  leftEarY: 0,
  rightEarX: 0,
  rightEarY: 0,
  leftArmX: 0,
  leftArmY: 0,
  rightArmX: 0,
  rightArmY: 0,
  leftFootX: 0,
  leftFootY: 0,
  rightFootX: 0,
  rightFootY: 0,
};

type Point = { x: number; y: number };

type MeshRenderer = {
  upload: (source: HTMLCanvasElement) => void;
  render: (
    landmarks: SoftMeshLandmarks,
    pose: SoftMeshPose,
    direction: -1 | 1,
  ) => void;
  destroy: () => void;
};

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;

  void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function weightFor(point: Point, anchor: SoftMeshPoint) {
  const dx = (point.x - anchor.x) / Math.max(0.001, anchor.radiusX);
  const dy = (point.y - anchor.y) / Math.max(0.001, anchor.radiusY);
  return Math.exp(-(dx * dx + dy * dy) * 2.15);
}

function moveLocal(
  point: Point,
  anchor: SoftMeshPoint,
  x: number,
  y: number,
) {
  const weight = weightFor(point, anchor);
  point.x += x * weight;
  point.y += y * weight;
}

function rotateLocal(
  point: Point,
  anchor: SoftMeshPoint,
  angle: number,
) {
  if (Math.abs(angle) < 0.00001) return;
  const weight = weightFor(point, anchor);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const rotatedX = anchor.x + dx * cosine - dy * sine;
  const rotatedY = anchor.y + dx * sine + dy * cosine;
  point.x += (rotatedX - point.x) * weight;
  point.y += (rotatedY - point.y) * weight;
}

function scaleLocal(
  point: Point,
  anchor: SoftMeshPoint,
  scaleX: number,
  scaleY: number,
) {
  const weight = weightFor(point, anchor);
  const targetX = anchor.x + (point.x - anchor.x) * scaleX;
  const targetY = anchor.y + (point.y - anchor.y) * scaleY;
  point.x += (targetX - point.x) * weight;
  point.y += (targetY - point.y) * weight;
}

function deformPoint(
  sourceX: number,
  sourceY: number,
  landmarks: SoftMeshLandmarks,
  pose: SoftMeshPose,
) {
  const point = { x: sourceX, y: sourceY };

  scaleLocal(
    point,
    landmarks.body,
    1 + pose.bodyBreath,
    1 + pose.bodyStretch,
  );
  rotateLocal(point, landmarks.body, pose.bodyLean);

  rotateLocal(point, landmarks.head, pose.headAngle);
  moveLocal(point, landmarks.head, pose.headX, pose.headY);

  moveLocal(
    point,
    landmarks.leftEar,
    pose.leftEarX,
    pose.leftEarY,
  );
  moveLocal(
    point,
    landmarks.rightEar,
    pose.rightEarX,
    pose.rightEarY,
  );

  moveLocal(
    point,
    landmarks.leftArm,
    pose.leftArmX,
    pose.leftArmY,
  );
  moveLocal(
    point,
    landmarks.rightArm,
    pose.rightArmX,
    pose.rightArmY,
  );
  moveLocal(
    point,
    landmarks.leftFoot,
    pose.leftFootX,
    pose.leftFootY,
  );
  moveLocal(
    point,
    landmarks.rightFoot,
    pose.rightFootX,
    pose.rightFootY,
  );

  const centerX = 0.5;
  const centerY = 0.55;
  const scaledX = centerX + (point.x - centerX) * pose.scaleX;
  const scaledY = centerY + (point.y - centerY) * pose.scaleY;
  const cosine = Math.cos(pose.rotation);
  const sine = Math.sin(pose.rotation);
  const dx = scaledX - centerX;
  const dy = scaledY - centerY;

  return {
    x: centerX + dx * cosine - dy * sine + pose.x,
    y: centerY + dx * sine + dy * cosine + pose.y,
  };
}

export function createSoftMeshRenderer(
  canvas: HTMLCanvasElement,
  divisions = 22,
): MeshRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!vertexBuffer || !indexBuffer || !texture) return null;

  const vertexCount = (divisions + 1) * (divisions + 1);
  const vertices = new Float32Array(vertexCount * 4);
  const indexList: number[] = [];
  for (let row = 0; row < divisions; row += 1) {
    for (let column = 0; column < divisions; column += 1) {
      const topLeft = row * (divisions + 1) + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + divisions + 1;
      const bottomRight = bottomLeft + 1;
      indexList.push(
        topLeft,
        bottomLeft,
        topRight,
        topRight,
        bottomLeft,
        bottomRight,
      );
    }
  }
  const indices = new Uint16Array(indexList);

  gl.useProgram(program);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  // Mesh UVs deliberately use the DOM/canvas top-left convention. Flipping
  // the uploaded canvas as well would turn the finished mascot upside down.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const textureLocation = gl.getAttribLocation(program, "a_texCoord");
  const samplerLocation = gl.getUniformLocation(program, "u_texture");
  gl.uniform1i(samplerLocation, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const upload = (source: HTMLCanvasElement) => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      source,
    );
  };

  const render = (
    landmarks: SoftMeshLandmarks,
    pose: SoftMeshPose,
    direction: -1 | 1,
  ) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let offset = 0;
    for (let row = 0; row <= divisions; row += 1) {
      const sourceY = row / divisions;
      for (let column = 0; column <= divisions; column += 1) {
        const sourceX = column / divisions;
        const deformed = deformPoint(sourceX, sourceY, landmarks, pose);
        vertices[offset] = deformed.x * 2 - 1;
        vertices[offset + 1] = 1 - deformed.y * 2;
        vertices[offset + 2] = direction < 0 ? 1 - sourceX : sourceX;
        vertices[offset + 3] = sourceY;
        offset += 4;
      }
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
    );
    gl.enableVertexAttribArray(textureLocation);
    gl.vertexAttribPointer(
      textureLocation,
      2,
      gl.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  };

  const destroy = () => {
    gl.deleteTexture(texture);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  };

  return { upload, render, destroy };
}
