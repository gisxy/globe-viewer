import twgl from 'twgl.js'
import vert from './shader.vert'
import frag from './shader.frag'
var m4 = twgl.m4

export default class Renderer {
  constructor(gl) {
    this.gl = gl

    gl.getExtension("OES_standard_derivatives")

    var ext = gl.getExtension("EXT_texture_filter_anisotropic")

    this.programInfo = twgl.createProgramInfo(gl, [vert, frag])

    this.bufferInfo = twgl.primitives.createPlaneBufferInfo(
      gl,
      2,
      1,
      250,
      250
    )

    this.textures = twgl.createTextures(gl, {
      diffuseMap: { src: 'data/color-4096.png' },
      topographyMap: { src: 'data/topography-4096.png' },
      bathymetryMap: { src: 'data/bathymetry-blue-2048.png' }
    })

    if (ext) {
      gl.texParameterf(
        gl.TEXTURE_2D,
        ext.TEXTURE_MAX_ANISOTROPY_EXT,
        4
      );

      for (name in this.textures) {
        var texture = this.textures[name];
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 16);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    }

    this.uniforms = {
      diffuseMap: this.textures.diffuseMap,
      topographyMap: this.textures.topographyMap,
      bathymetryMap: this.textures.bathymetryMap,
      lightPosition: [1, 1, 0]
    }
  }

  render(time) {
    var gl = this.gl
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    var projection = m4.perspective(
      30 * Math.PI / 180,
      gl.canvas.clientWidth / gl.canvas.clientHeight,
      0.5,
      100
    )

    var eye = [
      4 * Math.sin(time / 1000),
      4,
      0.3 * Math.cos(time / 2000)
    ]

    var target = [0, 0, 0]
    var up = [0, 0, 1]

    var camera = m4.lookAt(eye, target, up)
    var view = m4.inverse(camera)
    var viewProjection = m4.multiply(view, projection)

    Object.assign(this.uniforms, {
      view: view,
      viewProjection: viewProjection,
      sphereMix: (Math.sin(time * 0.001) + 1) / 2
    })

    gl.useProgram(this.programInfo.program)
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo)
    twgl.setUniforms(this.programInfo, this.uniforms)

    gl.drawElements(
      gl.TRIANGLES,
      this.bufferInfo.numElements,
      gl.UNSIGNED_SHORT,
      0
    )
  }
}
