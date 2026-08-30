"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EonSignal } from "@/components/visual/VisualArtifacts";

export function Splash() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("eternime-splash-v2")) return;
      sessionStorage.setItem("eternime-splash-v2", "1");
    } catch {}
    const start = setTimeout(() => setShow(true), 0);
    const stop = setTimeout(() => setShow(false), 1250);
    return () => { clearTimeout(start); clearTimeout(stop); };
  }, []);

  return <AnimatePresence>{show ? (
    <motion.div className="eon-splash" initial={{opacity:1}} exit={{opacity:0,filter:"blur(10px)"}} transition={{duration:.5,ease:[.22,1,.36,1]}}>
      <motion.div initial={{scaleX:.72,opacity:0}} animate={{scaleX:1,opacity:1}} transition={{duration:.7,ease:[.22,1,.36,1]}}><EonSignal className="eon-splash-signal" label="EON iniciando" /></motion.div>
      <motion.div className="eon-splash-word" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.22,duration:.5}}>EON</motion.div>
      <motion.p initial={{opacity:0}} animate={{opacity:.62}} transition={{delay:.4,duration:.45}}>ETERNIME · TU MEMORIA VIVA</motion.p>
    </motion.div>
  ) : null}</AnimatePresence>;
}
