'use client'

import { useEffect, useRef, useState } from 'react'
import type { AssistantState } from '@/types'

/**
 * Iridescent fluid-blob orb rendered with a raw WebGL2 fragment shader.
 * State drives distortion amplitude, flow speed, energy and tint — all
 * spring-lerped in JS so transitions morph smoothly.
 * Falls back to a CSS gradient sphere when WebGL2 is unavailable.
 */

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `#version 300 es
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_amp;
uniform float u_energy;
uniform vec3  u_tintA;
uniform vec3  u_tintB;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float t = u_time;

  // Domain-warped blob silhouette
  vec2 w = uv * 1.6;
  float n1 = fbm(w + vec2(t * 0.22, -t * 0.18));
  float n2 = fbm(w * 1.7 - vec2(t * 0.15, t * 0.12));
  float rad = 0.60 + u_amp * (n1 - 0.5) * 2.0 + u_amp * 0.5 * (n2 - 0.5);
  float r = length(uv);
  float d = r - rad;

  // Iridescent phase field — slow oil-slick drift
  float ph = fbm(uv * 2.2 + vec2(t * 0.12, -t * 0.09)) + (uv.x - uv.y) * 0.15;
  vec3 irid = mix(u_tintA, u_tintB, smoothstep(0.2, 0.8, fract(ph)));
  irid += 0.18 * cos(6.28318 * (ph + vec3(0.0, 0.33, 0.67)));
  irid = max(irid, vec3(0.0));

  // Interior: depth falloff + internal flow
  float inside = smoothstep(0.012, -0.012, d);
  float depth = pow(1.0 - clamp(r / max(rad, 1e-3), 0.0, 1.0), 0.65);
  float swirl = fbm(uv * 3.0 + vec2(t * 0.2, t * 0.14));
  vec3 inner = irid * (0.30 + 0.70 * depth) + irid * swirl * 0.22;
  // top-left key light
  inner += vec3(0.10, 0.10, 0.14) * clamp(dot(uv, vec2(-0.55, 0.75)) + 0.4, 0.0, 1.0) * depth;

  // Fresnel rim — bright iridescent edge band
  float rim = exp(-abs(d) * 26.0);
  vec3 rimCol = irid * 1.55 + vec3(0.22);

  // Outer bloom
  float glow = exp(-max(d, 0.0) * 5.2) * (1.0 - inside);

  vec3 col = inner * inside * u_energy
           + rimCol * rim * 0.9 * u_energy
           + irid * glow * 0.38 * u_energy;

  float alpha = clamp(inside + rim * 0.85 + glow * 0.5, 0.0, 1.0);
  outColor = vec4(col, alpha);
}
`

interface OrbParams { amp: number; speed: number; energy: number; tintA: [number, number, number]; tintB: [number, number, number] }

const STATE_PARAMS: Record<AssistantState, OrbParams> = {
  idle:       { amp: 0.055, speed: 0.35, energy: 0.80, tintA: [0.486, 0.361, 1.0],   tintB: [0.298, 0.788, 0.941] },
  listening:  { amp: 0.13,  speed: 0.90, energy: 1.05, tintA: [0.63, 0.53, 1.0],     tintB: [0.36, 0.86, 0.98] },
  processing: { amp: 0.19,  speed: 1.75, energy: 0.95, tintA: [0.298, 0.788, 0.941], tintB: [0.486, 0.361, 1.0] },
  speaking:   { amp: 0.16,  speed: 1.10, energy: 1.18, tintA: [0.72, 0.44, 1.0],     tintB: [0.40, 0.72, 1.0] },
}

interface ShaderOrbProps {
  state: AssistantState
  size: number
  className?: string
}

export function ShaderOrb({ state, size, className }: ShaderOrbProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // Create a fresh canvas per effect run: a canvas whose WebGL context was
    // lost (e.g. React StrictMode remount) can never hand out a context again.
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    host.appendChild(canvas)

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true })
    if (!gl) { host.removeChild(canvas); setFallback(true); return }

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * DPR
    canvas.height = size * DPR

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh))
        return null
      }
      return sh
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) { setFallback(true); return }

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFallback(true); return }
    gl.useProgram(prog)

    // Fullscreen triangle
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.viewport(0, 0, canvas.width, canvas.height)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uAmp = gl.getUniformLocation(prog, 'u_amp')
    const uEnergy = gl.getUniformLocation(prog, 'u_energy')
    const uTintA = gl.getUniformLocation(prog, 'u_tintA')
    const uTintB = gl.getUniformLocation(prog, 'u_tintB')
    gl.uniform2f(uRes, canvas.width, canvas.height)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const motionScale = reducedMotion ? 0.12 : 1

    // Spring-lerped params for smooth state morphs
    const cur: OrbParams = { ...STATE_PARAMS.idle, tintA: [...STATE_PARAMS.idle.tintA], tintB: [...STATE_PARAMS.idle.tintB] }
    let tAccum = Math.random() * 100
    let last = performance.now()
    let rafId = 0

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const target = STATE_PARAMS[stateRef.current]
      const k = 1 - Math.exp(-dt * 4.5) // framerate-independent spring

      cur.amp = lerp(cur.amp, target.amp, k)
      cur.speed = lerp(cur.speed, target.speed, k)
      cur.energy = lerp(cur.energy, target.energy, k)
      for (let i = 0; i < 3; i++) {
        cur.tintA[i] = lerp(cur.tintA[i], target.tintA[i], k)
        cur.tintB[i] = lerp(cur.tintB[i], target.tintB[i], k)
      }

      tAccum += dt * cur.speed * motionScale

      // Speaking: amplitude wobble like a voice envelope
      let amp = cur.amp
      if (stateRef.current === 'speaking') {
        amp += 0.055 * Math.abs(Math.sin(tAccum * 3.1) * Math.sin(tAccum * 1.9))
      }

      gl.uniform1f(uTime, tAccum)
      gl.uniform1f(uAmp, amp)
      gl.uniform1f(uEnergy, cur.energy)
      gl.uniform3f(uTintA, cur.tintA[0], cur.tintA[1], cur.tintA[2])
      gl.uniform3f(uTintB, cur.tintB[0], cur.tintB[1], cur.tintB[2])

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafId)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      if (canvas.parentNode === host) host.removeChild(canvas)
    }
  }, [size])

  if (fallback) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 32%, #c4b5ff 0%, #7c5cff 45%, #1c1450 100%)',
          boxShadow: '0 0 60px rgba(124,92,255,0.45), 0 0 18px rgba(76,201,240,0.3)',
        }}
      />
    )
  }

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={className}
      style={{ width: size, maxWidth: '72vw', aspectRatio: '1 / 1' }}
    />
  )
}
