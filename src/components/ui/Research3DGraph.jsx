import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function Research3DGraph({ data }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mountEl = mountRef.current;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    // Subtle fog to fade out distant nodes
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(60, mountEl.clientWidth / mountEl.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1);
    mountEl.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 2. Central 'Query' Hub
    const centralGeo = new THREE.IcosahedronGeometry(2, 1);
    const centralMat = new THREE.MeshBasicMaterial({ 
      color: 0x1E3A8A, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.8 
    });
    const centralNode = new THREE.Mesh(centralGeo, centralMat);
    mainGroup.add(centralNode);

    // Inner glow for central node
    const glowGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x1E40AF,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const centralGlow = new THREE.Mesh(glowGeo, glowMat);
    mainGroup.add(centralGlow);

    // 3. Data Nodes (Orbiting)
    const cases = data?.length > 0 ? data : Array.from({length: 12}); 
    const numNodes = cases.length;
    const radius = 12;

    const nodeGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ 
      color: 0x1E40AF, 
      transparent: true, 
      opacity: 0.9 
    });

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x1E3A8A,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });

    const nodes = [];

    // Distribute nodes in a spherical pattern
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    cases.forEach((_, i) => {
      const y = 1 - (i / (numNodes - 1)) * 2; // y goes from 1 to -1
      const r = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
      
      // Scale based on relevance or random if not present
      const relevance = _.relevance ? (_.relevance / 100) : (0.5 + Math.random() * 0.5);
      const randomRadius = radius * (0.8 + Math.random() * 0.4);
      
      const targetPos = new THREE.Vector3(x * randomRadius, y * randomRadius, z * randomRadius);
      nodeMesh.position.copy(targetPos);
      nodeMesh.scale.setScalar(relevance * 1.5);
      
      // Color based on source type
      if (_.source_type === "knowledge_base") {
        nodeMesh.material.color.setHex(0x10B981); // Emerald for strong DB matches
      } else if (_.source_type === "web_search") {
        nodeMesh.material.color.setHex(0xF59E0B); // Amber for web
      }

      mainGroup.add(nodeMesh);
      nodes.push({ mesh: nodeMesh, originalPos: targetPos, speed: 0.01 + Math.random() * 0.02 });

      // Draw line from central hub to this node
      const points = [new THREE.Vector3(0,0,0), targetPos];
      const lg = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lg, lineMat);
      mainGroup.add(line);
    });

    // 4. Background Ambient Particles
    const bgGeo = new THREE.BufferGeometry();
    const bgCount = 200;
    const bgPos = new Float32Array(bgCount * 3);
    for(let i=0; i<bgCount*3; i++) {
      bgPos[i] = (Math.random() - 0.5) * 60;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.2
    });
    const bgParticles = new THREE.Points(bgGeo, bgMat);
    scene.add(bgParticles);

    // 5. Camera & Animation
    camera.position.z = 25;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    let animationFrameId;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      // Group rotation
      mainGroup.rotation.y = time * 0.1;
      mainGroup.rotation.x = Math.sin(time * 0.05) * 0.2;

      // Central node pulse
      const pulse = 1 + Math.sin(time * 2) * 0.1;
      centralNode.scale.set(pulse, pulse, pulse);
      centralGlow.scale.set(pulse * 1.2, pulse * 1.2, pulse * 1.2);

      // Float nodes slightly
      nodes.forEach((n, i) => {
        n.mesh.position.y = n.originalPos.y + Math.sin(time * 2 + i) * 0.5;
        // Optionally update the lines here if they were dynamic, but keeping them static to the original pos is fine for performance
      });

      // Subtle particle drift
      bgParticles.rotation.y -= 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Intersection (Hover) Setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event) => {
      const rect = mountEl.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes.map(n => n.mesh));

      // Reset scales
      nodes.forEach(n => {
        n.mesh.scale.setScalar(n.mesh.scale.x); // Keep base scale
      });

      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        // Enlarge hovered node slightly
        intersects[0].object.scale.multiplyScalar(1.2);
      } else {
        document.body.style.cursor = 'default';
      }
    };

    mountEl.addEventListener('mousemove', onMouseMove);

    const handleResize = () => {
      camera.aspect = mountEl.clientWidth / mountEl.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountEl.removeEventListener('mousemove', onMouseMove);
      mountEl.removeChild(renderer.domElement);
      cancelAnimationFrame(animationFrameId);
      document.body.style.cursor = 'default';
      
      // Cleanup geometries and materials
      centralGeo.dispose();
      centralMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      renderer.dispose();
    };
  }, [data]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div ref={mountRef} className="absolute inset-0 z-0" />
      <div className="absolute top-4 left-5 z-10 pointer-events-none flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
         <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">Live Knowledge Graph Retrieval</p>
      </div>
      <div className="absolute bottom-4 right-5 z-10 pointer-events-none flex flex-col items-end gap-1">
         <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[9px] text-slate-400 uppercase tracking-wider">Statutory Match</span></div>
         <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-500" /><span className="text-[9px] text-slate-400 uppercase tracking-wider">Precedent Match</span></div>
         <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-[9px] text-slate-400 uppercase tracking-wider">Web Enrichment</span></div>
      </div>
    </div>
  );
}
